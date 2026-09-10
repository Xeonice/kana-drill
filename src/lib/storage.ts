import type { Deck, Progress } from "../types";

const KEY_PREFIX = "kana-drill:";

function key(deckId: string) {
  return `${KEY_PREFIX}${deckId}:v1`;
}

export function freshProgress(deck: Deck): Progress {
  return {
    version: 1,
    deckId: deck.id,
    order: deck.words.map((w) => w.id),
    cursor: 0,
    round: 1,
    wrong: {},
    mastered: {},
    updatedAt: new Date().toISOString(),
  };
}

/** 存档可能来自旧版本、被手工改过、或牌组内容变了，一律校验后再用。 */
function isUsable(value: unknown, deck: Deck): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Partial<Progress>;
  if (p.version !== 1 || p.deckId !== deck.id) return false;
  if (!Array.isArray(p.order) || p.order.length === 0) return false;
  const ids = new Set(deck.words.map((w) => w.id));
  if (!p.order.every((id) => typeof id === "number" && ids.has(id))) return false;
  if (typeof p.cursor !== "number" || p.cursor < 0 || p.cursor > p.order.length) return false;
  if (typeof p.round !== "number" || p.round < 1) return false;
  return true;
}

export function loadProgress(deck: Deck): Progress | null {
  try {
    const raw = localStorage.getItem(key(deck.id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isUsable(parsed, deck)) return null;
    return {
      ...parsed,
      wrong: parsed.wrong ?? {},
      mastered: parsed.mastered ?? {},
    };
  } catch {
    // 隐私模式、存储被禁用、内容损坏——一律当作没有存档
    return null;
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(key(progress.deckId), JSON.stringify(progress));
  } catch {
    // 存不下就算了，本次学习照常进行
  }
}
