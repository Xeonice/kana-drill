import type { Archive, Box, WordStat } from "../types";
import { cardKey } from "../data";

const KEY = "kana-drill:archive:v2";
const LEGACY_PREFIX = "kana-drill:";

/**
 * Leitner 间隔：答对升一级，答错掉回第 1 级。
 * 级别越高，下次再考的间隔越长 —— 熟的词让位给生的词。
 */
const INTERVAL_DAYS: Record<Box, number> = {
  1: 0, // 当天就该再见到
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

export const BOX_LABEL: Record<Box, string> = {
  1: "苦手",
  2: "あやふや",
  3: "覚えた",
  4: "定着中",
  5: "定着",
};

export function today(): string {
  return toDay(new Date());
}

function toDay(d: Date): string {
  // 用本地时区，避免跨时区把「今天」算成昨天
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return toDay(new Date(y, m - 1, d + n));
}

export function isDue(stat: WordStat, on: string = today()): boolean {
  return stat.dueOn <= on;
}

export function daysUntilDue(stat: WordStat, on: string = today()): number {
  const [y1, m1, d1] = on.split("-").map(Number);
  const [y2, m2, d2] = stat.dueOn.split("-").map(Number);
  const ms = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
  return Math.round(ms / 86_400_000);
}

export function emptyArchive(): Archive {
  return { version: 2, stats: {}, updatedAt: new Date().toISOString() };
}

/** 记一次判定：答对升级并推远下次复习，答错掉回第 1 级。 */
export function grade(archive: Archive, key: string, ok: boolean): Archive {
  const prev = archive.stats[key];
  const box: Box = ok
    ? (Math.min(5, (prev?.box ?? 1) + 1) as Box)
    : 1;
  const day = today();

  const stat: WordStat = {
    box,
    wrong: (prev?.wrong ?? 0) + (ok ? 0 : 1),
    right: (prev?.right ?? 0) + (ok ? 1 : 0),
    lastSeen: day,
    dueOn: addDays(day, INTERVAL_DAYS[box]),
  };

  return {
    version: 2,
    stats: { ...archive.stats, [key]: stat },
    updatedAt: new Date().toISOString(),
  };
}

function isUsable(value: unknown): value is Archive {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Partial<Archive>;
  return a.version === 2 && typeof a.stats === "object" && a.stats !== null;
}

/**
 * v1 是按牌组存的（order/cursor/wrong/mastered），没有熟练度概念。
 * 把它的结果折算成一个起始等级，这样已经练过的进度不至于白费。
 */
function migrateLegacy(): Archive | null {
  let found = false;
  const stats: Record<string, WordStat> = {};
  const day = today();

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (!storageKey?.startsWith(LEGACY_PREFIX) || !storageKey.endsWith(":v1")) continue;

      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const old = JSON.parse(raw) as {
        deckId?: string;
        wrong?: Record<string, number>;
        mastered?: Record<string, boolean>;
      };
      if (!old.deckId) continue;

      const wrongMap = old.wrong ?? {};
      const masteredMap = old.mastered ?? {};
      const ids = new Set([...Object.keys(wrongMap), ...Object.keys(masteredMap)]);

      ids.forEach((idText) => {
        const wordId = Number(idText);
        if (!Number.isInteger(wordId)) return;
        const wrong = wrongMap[idText] ?? 0;
        const mastered = masteredMap[idText] === true;
        if (!wrong && !mastered) return;

        found = true;
        // 一次答对给 3 级，错过又答对给 2 级，还没答对的留在 1 级
        const box: Box = mastered ? (wrong > 0 ? 2 : 3) : 1;
        stats[cardKey(old.deckId!, wordId)] = {
          box,
          wrong,
          right: mastered ? 1 : 0,
          lastSeen: day,
          dueOn: day, // 迁移进来的词今天先都过一遍
        };
      });
    }
  } catch {
    return null;
  }

  if (!found) return null;
  return { version: 2, stats, updatedAt: new Date().toISOString() };
}

export function loadArchive(): Archive {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isUsable(parsed)) return parsed;
    }
  } catch {
    // 存储不可用或内容损坏，往下走迁移/空档案
  }
  return migrateLegacy() ?? emptyArchive();
}

export function saveArchive(archive: Archive): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(archive));
  } catch {
    // 存不下就算了，本次练习照常进行
  }
}

export function clearArchive(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
}
