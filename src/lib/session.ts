import type { Archive, Card, Origin, Session } from "../types";
import { isDue } from "./archive";

/** 一次练习的规模。数字是上限，不够就少抽一点。 */
export type Size = "light" | "normal" | "full";

export const SIZE_LABEL: Record<Size, string> = {
  light: "軽め",
  normal: "標準",
  full: "たっぷり",
};

/** 选中量级时显示的一句说明 */
export const SIZE_HINT: Record<Size, string> = {
  light: "到期的词里挑 20 个",
  normal: "到期的词里挑 40 个",
  full: "选中范围全部过一遍，不管到没到期",
};

const SIZE_CAP: Record<Size, number> = {
  light: 20,
  normal: 40,
  full: Number.POSITIVE_INFINITY,
};

/** 新词占比过高会挤掉复习，留出余量给到期的旧词 */
const NEW_SHARE = 0.5;

export type Plan = {
  new: Card[];
  review: Card[];
  check: Card[];
  total: number;
};

function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 按熟练度挑出今天该练的词：
 * - 新出：还没见过的
 * - 要復習：等级低（1-2）
 * - 定着確認：等级高（3-5），抽检用
 *
 * 軽め / 標準 只收已经到期的旧词，到期的优先占名额，剩下的才给新词；
 * 「たっぷり」无视到期，把选中范围整个过一遍 —— 想一次回顾全部内容时用它。
 */
export function buildPlan(pool: Card[], archive: Archive, size: Size): Plan {
  const everything = size === "full";
  const fresh: Card[] = [];
  const review: Card[] = [];
  const check: Card[] = [];

  pool.forEach((card) => {
    const stat = archive.stats[card.key];
    if (!stat) fresh.push(card);
    else if (!everything && !isDue(stat)) return;
    else if (stat.box <= 2) review.push(card);
    else check.push(card);
  });

  const cap = SIZE_CAP[size];
  if (!Number.isFinite(cap)) {
    return {
      new: shuffle(fresh),
      review: shuffle(review),
      check: shuffle(check),
      total: fresh.length + review.length + check.length,
    };
  }

  // 复习先占位：生的词排在熟的词前面
  const pickedReview = shuffle(review).slice(0, cap);
  const pickedCheck = shuffle(check).slice(0, Math.max(0, cap - pickedReview.length));
  const usedByOld = pickedReview.length + pickedCheck.length;

  // 新词至少保证能拿到一半名额，免得复习积压时一个新词都学不到
  const newRoom = Math.max(
    Math.min(fresh.length, Math.round(cap * NEW_SHARE)),
    cap - usedByOld,
  );
  const pickedNew = shuffle(fresh).slice(0, Math.max(0, Math.min(newRoom, cap)));

  // 新词占了名额之后，把旧词裁到总量之内（复习优先于抽检）
  const room = Math.max(0, cap - pickedNew.length);
  const finalReview = pickedReview.slice(0, room);
  const finalCheck = pickedCheck.slice(0, Math.max(0, room - finalReview.length));

  return {
    new: pickedNew,
    review: finalReview,
    check: finalCheck,
    total: pickedNew.length + finalReview.length + finalCheck.length,
  };
}

/** 把选好的词铺成一次练习。生的词先出，熟的词垫后。 */
export function startSession(plan: Plan): Session {
  const origins: Record<string, Origin> = {};
  plan.new.forEach((c) => (origins[c.key] = "new"));
  plan.review.forEach((c) => (origins[c.key] = "review"));
  plan.check.forEach((c) => (origins[c.key] = "check"));

  const order = shuffle([...plan.review, ...plan.new, ...plan.check]).map((c) => c.key);

  return {
    origins,
    order,
    cursor: 0,
    round: 1,
    mastered: {},
    missed: {},
    graded: {},
  };
}
