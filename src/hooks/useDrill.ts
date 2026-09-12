import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Archive, Card, Mode, Session } from "../types";
import { CARD_BY_KEY, cardsOfDecks, DECKS } from "../data";
import {
  clearArchive,
  emptyArchive,
  grade,
  loadArchive,
  merge,
  saveArchive,
  statKey,
} from "../lib/archive";
import { buildPlan, startSession, type Plan, type Size } from "../lib/session";
import { fetchArchive, pushArchive, type SyncState } from "../lib/cloud";
import { onVoicesReady, speechAvailable } from "../lib/speech";

export type Phase = "start" | "drill" | "done";

export type Counts = {
  /** 本次练习已答对 */
  ok: number;
  /** 本巡还没轮到 */
  todo: number;
  /** 本巡答错、等着下一巡 */
  miss: number;
};

const PUSH_DELAY = 800;

export function useDrill() {
  const [archive, setArchive] = useState<Archive>(emptyArchive);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>("offline");
  const [deckIds, setDeckIds] = useState<string[]>(() => DECKS.map((d) => d.id));
  const [size, setSize] = useState<Size>("normal");
  const [mode, setMode] = useState<Mode>("kana");
  const [session, setSession] = useState<Session | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  const pushTimer = useRef<number | undefined>(undefined);
  const latest = useRef<Archive>(archive);
  latest.current = archive;

  // 语音列表是异步填充的，就绪后再点亮听力模式
  useEffect(() => {
    setCanSpeak(speechAvailable());
    return onVoicesReady(() => setCanSpeak(speechAvailable()));
  }, []);

  // 先用本机档案立刻开张，再拉云端合并 —— 网络慢也不挡着背单词
  useEffect(() => {
    const local = loadArchive();
    setArchive(local);
    setReady(true);

    let cancelled = false;
    setSync("syncing");
    fetchArchive().then((remote) => {
      if (cancelled) return;
      if (!remote) {
        setSync("offline");
        return;
      }
      setArchive((current) => merge(current, remote));
      setSync("synced");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveArchive(archive);
  }, [archive, ready]);

  /** 判定之后把档案推上云端，连点时合并成一次请求。 */
  const schedulePush = useCallback(() => {
    window.clearTimeout(pushTimer.current);
    setSync("syncing");
    pushTimer.current = window.setTimeout(() => {
      pushArchive(latest.current).then((merged) => {
        if (!merged) {
          setSync("failed");
          return;
        }
        // 服务端合并进了别的设备的记录，本地跟上
        setArchive((current) => merge(current, merged));
        setSync("synced");
      });
    }, PUSH_DELAY);
  }, []);

  useEffect(() => () => window.clearTimeout(pushTimer.current), []);

  const pool = useMemo(() => cardsOfDecks(deckIds), [deckIds]);

  /** 开始面板上展示的今日构成。练习中不再重算，免得抽签结果跳动。 */
  const plan: Plan = useMemo(
    () => buildPlan(pool, archive, size, mode),
    [pool, archive, size, mode],
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
    setSession(startSession(plan, mode));
    setRevealed(false);
  }, [plan, mode]);

  const judge = useCallback(
    (ok: boolean) => {
      setSession((prev) => {
        if (!prev) return prev;
        const key = prev.order[prev.cursor];
        if (key === undefined) return prev;

        // 长期档案只认一次练习里的第一次判定，重练不重复升级
        if (!prev.graded[key]) {
          setArchive((a) => grade(a, statKey(key, prev.mode), ok));
          schedulePush();
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
    [schedulePush],
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
    const empty = emptyArchive();
    setArchive(empty);
    setSession(null);
    setRevealed(false);
    latest.current = empty;
    schedulePush();
  }, [schedulePush]);

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
    sync,
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
    mode,
    canSpeak,
    setSize,
    setMode,
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
