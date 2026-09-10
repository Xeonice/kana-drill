import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Deck, Progress, Word } from "../types";
import { freshProgress, loadProgress, saveProgress } from "../lib/storage";

type Action =
  | { type: "restore"; saved: Progress }
  | { type: "judge"; ok: boolean }
  | { type: "shuffle" }
  | { type: "reset"; deck: Deck }
  | { type: "retryWrong" };

function stamp(p: Progress): Progress {
  return { ...p, updatedAt: new Date().toISOString() };
}

function shuffled(ids: number[]): number[] {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "restore":
      return action.saved;

    case "judge": {
      const id = state.order[state.cursor];
      if (id === undefined) return state;

      const mastered = { ...state.mastered, [id]: action.ok };
      const wrong = action.ok
        ? state.wrong
        : { ...state.wrong, [id]: (state.wrong[id] ?? 0) + 1 };

      let { order, cursor, round } = state;
      cursor += 1;

      // 本巡走完：把还没答对的词收进下一巡
      if (cursor >= order.length) {
        const again = order.filter((wordId) => !mastered[wordId]);
        if (again.length > 0) {
          order = again;
          cursor = 0;
          round += 1;
        }
      }

      return stamp({ ...state, order, cursor, round, wrong, mastered });
    }

    case "shuffle": {
      // 只打乱还没判过的部分，已判过的保持原位，进度不受影响
      const done = state.order.slice(0, state.cursor);
      const rest = shuffled(state.order.slice(state.cursor));
      return stamp({ ...state, order: [...done, ...rest] });
    }

    case "reset":
      return freshProgress(action.deck);

    case "retryWrong": {
      // 只挑曾经答错过的词，重开一巡
      const pool = Object.keys(state.wrong)
        .map(Number)
        .filter((id) => (state.wrong[id] ?? 0) > 0);
      if (pool.length === 0) return state;
      const mastered = { ...state.mastered };
      pool.forEach((id) => {
        mastered[id] = false;
      });
      return stamp({
        ...state,
        order: shuffled(pool),
        cursor: 0,
        round: state.round + 1,
        mastered,
      });
    }
  }
}

export type Counts = {
  /** 已答对 */
  ok: number;
  /** 本巡还没轮到 */
  todo: number;
  /** 本巡答错、等着下一巡 */
  miss: number;
};

export function useDrill(deck: Deck) {
  const [progress, dispatch] = useReducer(reducer, deck, freshProgress);
  const [revealed, setRevealed] = useState(false);
  const [restored, setRestored] = useState(false);

  // 读存档要等挂载之后，避免 SSR / 预渲染时碰 localStorage
  useEffect(() => {
    const saved = loadProgress(deck);
    if (saved) dispatch({ type: "restore", saved });
    setRestored(true);
  }, [deck]);

  useEffect(() => {
    if (restored) saveProgress(progress);
  }, [progress, restored]);

  const byId = useMemo(() => new Map(deck.words.map((w) => [w.id, w])), [deck]);

  const finished =
    progress.cursor >= progress.order.length &&
    progress.order.every((id) => progress.mastered[id]);

  const current: Word | null = finished
    ? null
    : byId.get(progress.order[progress.cursor]) ?? null;

  const counts: Counts = useMemo(() => {
    const ok = deck.words.filter((w) => progress.mastered[w.id]).length;
    const todo = Math.max(0, progress.order.length - progress.cursor);
    return { ok, todo, miss: Math.max(0, deck.words.length - ok - todo) };
  }, [deck, progress]);

  const wrongList = useMemo(
    () =>
      deck.words
        .filter((w) => (progress.wrong[w.id] ?? 0) > 0)
        .sort((a, b) => (progress.wrong[b.id] ?? 0) - (progress.wrong[a.id] ?? 0)),
    [deck, progress.wrong],
  );

  const judge = useCallback((ok: boolean) => {
    dispatch({ type: "judge", ok });
    setRevealed(false);
  }, []);

  const reveal = useCallback(() => setRevealed(true), []);

  const shuffle = useCallback(() => {
    dispatch({ type: "shuffle" });
    setRevealed(false);
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset", deck });
    setRevealed(false);
  }, [deck]);

  const retryWrong = useCallback(() => {
    dispatch({ type: "retryWrong" });
    setRevealed(false);
  }, []);

  return {
    progress,
    current,
    revealed,
    finished,
    counts,
    wrongList,
    judge,
    reveal,
    shuffle,
    reset,
    retryWrong,
  };
}
