/**
 * 日语语音的音质分级与黑名单。
 *
 * 数据来自 readium/speech（Readium 的朗读项目，为 Thorium / Readium Web 维护
 * 的一份跨平台语音评测表）：
 *   https://github.com/readium/speech/blob/main/json/ja.json
 *   https://github.com/readium/speech/blob/main/json/filters/novelty.json
 *   https://github.com/readium/speech/blob/main/json/filters/veryLowQuality.json
 *
 * 内联而不是运行时抓取：这份表变动极慢，且朗读必须离线可用。
 */

export type Quality = "veryHigh" | "high" | "normal" | "low";

export const QUALITY_LABEL: Record<Quality, string> = {
  veryHigh: "最高音質",
  high: "高音質",
  normal: "標準",
  low: "簡易",
};

export const QUALITY_RANK: Record<Quality, number> = {
  veryHigh: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** 按 name 的子串匹配，排在前面的先命中。 */
const GRADES: { match: string; quality: Quality }[] = [
  // Edge 的在线神经语音，日语里公认最好的一档
  { match: "Nanami", quality: "veryHigh" },
  { match: "Keita", quality: "veryHigh" },

  // Apple 的 Siri premium 语音，需要用户在系统设置里下载
  { match: "Hattori", quality: "high" },
  // Chrome 桌面版预装
  { match: "Google 日本語", quality: "high" },
  { match: "日本語 1", quality: "high" },
  { match: "日本語 2", quality: "high" },
  { match: "日本語 3", quality: "high" },

  { match: "Ayumi", quality: "normal" },
  { match: "Haruka", quality: "normal" },
  { match: "Ichiro", quality: "normal" },

  // Apple 预装的压缩版，够用但音调偏平
  { match: "Kyoko", quality: "low" },
  { match: "Otoya", quality: "low" },
  { match: "O-Ren", quality: "low" },
];

/** Apple 的玩具音色，每种语言都配一份，音调夸张。 */
const NOVELTY = [
  "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
  "Good News", "Jester", "Organ", "Superstar", "Trinoids", "Whisper",
  "Wobble", "Zarvox",
];

/** 有更好的预装选项时就不该出现的低质量音色。 */
const VERY_LOW = [
  "Eddy", "Flo", "Grandma", "Grandpa", "Jacques", "Reed", "Rocko", "Sandy",
  "Shelley", "Fred", "Junior", "Kathy", "Ralph", "eSpeak",
];

const EXCLUDED = [...NOVELTY, ...VERY_LOW].map((n) => n.toLowerCase());

/** 这个音色是否该从选择器里去掉。 */
export function excluded(name: string): boolean {
  const n = name.toLowerCase();
  // 「Eddy (日本語（日本）)」这种本地化名字也要认出来
  return EXCLUDED.some((bad) => n.startsWith(bad) || n.includes(`${bad} (`));
}

/** 评级；表里没有的按「標準」对待，不武断贬低。 */
export function qualityOf(name: string): Quality {
  const hit = GRADES.find((g) => name.includes(g.match));
  return hit ? hit.quality : "normal";
}

/** 好音色在前。同一档保持系统给的原顺序。 */
export function byQuality(a: SpeechSynthesisVoice, b: SpeechSynthesisVoice): number {
  return QUALITY_RANK[qualityOf(a.name)] - QUALITY_RANK[qualityOf(b.name)];
}
