import { useCallback, useEffect, useMemo, useState } from "react";
import type { Archive, Card, Session } from "../types";
import { CARD_BY_KEY, cardsOfDecks, DECKS } from "../data";
import { emptyArchive, grade, loadArchive, saveArchive, clearArchive } from "../lib/archive";
import { buildPlan, startSession, type Plan, type Size } from "../lib/session";

export type Phase = "start" | "drill" | "done";

export type Counts = {
  /** 本次练习已答对 */
  ok: number;
  /** 本巡还没轮到 */
  todo: number;
  /** 本巡答错、等着下一巡 */
  miss: number;
};

export function useDrill() {
  const [archive, setArchive] = useState<Archive>(emptyArchive);
  const [ready, setReady] = useState(false);
  const [deckIds, setDeckIds] = useState<string[]>(() => DECKS.map((d) => d.id));
  const [size, setSize] = useState<Size>("normal");
  const [session, setSession] = useState<Session | null>(null);
  const [revealed, setRevealed] = useState(false);

  // 读档要等挂载之后，避免预渲染时碰 localStorage
  useEffect(() => {
    setArchive(loadArchive());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveArchive(archive);
  }, [archive, ready]);

  const pool = useMemo(() => cardsOfDecks(deckIds), [deckIds]);

  /** 开始面板上展示的今日构成。练习中不再重算，免得抽签结果跳动。 */
  const plan: Plan = useMemo(
    () => buildPlan(pool, archive, size),
    [pool, archive, size],
  );

  const phase: Phase = !session
    ? "start"
    : session.cursor >= session.order.length && session.order.every((k) => session.mastered[k])
      ? "done"
      : "drill";

  const cards: Card[] = useMemo(
    () =>
      session
        ? Object.keys(session.origins)
            .map((k) => CARD_BY_KEY.get(k))
            .filter((c): c is Card => Boolean(c))
        : [],
    [session],
  );

  const current: Card | null =
    session && phase === "drill"
      ? CARD_BY_KEY.get(session.order[session.cursor]) ?? null
      : null;

  const counts: Counts = useMemo(() => {
    if (!session) return { ok: 0, todo: 0, miss: 0 };
    const total = Object.keys(session.origins).length;
    const ok = Object.values(session.mastered).filter(Boolean).length;
    const todo = Math.max(0, session.order.length - session.cursor);
    return { ok, todo, miss: Math.max(0, total - ok - todo) };
  }, [session]);

  const begin = useCallback(() => {
    if (plan.total === 0) return;
    setSession(startSession(plan));
    setRevealed(false);
  }, [plan]);

  const judge = useCallback(
    (ok: boolean) => {
      setSession((prev) => {
        if (!prev) return prev;
        const key = prev.order[prev.cursor];
        if (key === undefined) return prev;

        // 长期档案只认一次练习里的第一次判定，重练不重复升级
        if (!prev.graded[key]) {
          setArchive((a) => grade(a, key, ok));
        }

        const mastered = { ...prev.mastered, [key]: ok };
        const missed = ok ? prev.missed : { ...prev.missed, [key]: (prev.missed[key] ?? 0) + 1 };

        let { order, cursor, round } = prev;
        cursor += 1;

        // 本巡走完：把还没答对的词收进下一巡
        if (cursor >= order.length) {
          const again = order.filter((k) => !mastered[k]);
          if (again.length > 0) {
            order = again;
            cursor = 0;
            round += 1;
          }
        }

        return {
          ...prev,
          order,
          cursor,
          round,
          mastered,
          missed,
          graded: { ...prev.graded, [key]: true },
        };
      });
      setRevealed(false);
    },
    [],
  );

  const reveal = useCallback(() => setRevealed(true), []);

  const shuffleRest = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      // 只打乱还没判过的部分，已判进度不受影响
      const done = prev.order.slice(0, prev.cursor);
      const rest = prev.order.slice(prev.cursor);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      return { ...prev, order: [...done, ...rest] };
    });
    setRevealed(false);
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
    setRevealed(false);
  }, []);

  const resetArchive = useCallback(() => {
    clearArchive();
    setArchive(emptyArchive());
    setSession(null);
    setRevealed(false);
  }, []);

  const toggleDeck = useCallback((id: string) => {
    setDeckIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // 一个都不选就没词可练，保底留住最后一个
      return next.length > 0 ? next : prev;
    });
  }, []);

  const selectAllDecks = useCallback(() => setDeckIds(DECKS.map((d) => d.id)), []);

  /** 本次练习结束后，按本次答错次数排的复盘表 */
  const missedCards = useMemo(() => {
    if (!session) return [];
    return cards
      .filter((c) => (session.missed[c.key] ?? 0) > 0)
      .sort((a, b) => (session.missed[b.key] ?? 0) - (session.missed[a.key] ?? 0));
  }, [cards, session]);

  return {
    archive,
    phase,
    plan,
    session,
    cards,
    current,
    revealed,
    counts,
    missedCards,
    deckIds,
    size,
    setSize,
    toggleDeck,
    selectAllDecks,
    begin,
    judge,
    reveal,
    shuffleRest,
    endSession,
    resetArchive,
  };
}
