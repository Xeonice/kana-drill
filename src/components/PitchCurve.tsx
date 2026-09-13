import type { AccentPhrase } from "../lib/tts";

/**
 * 日语音高重音的标准画法：高音的拍画在上沿、低音画在下沿，
 * 降核处用一道下折标出来 —— 和辞典里的记号一致。
 */
export function PitchCurve({ phrases }: { phrases: AccentPhrase[] }) {
  if (phrases.length === 0) return null;

  return (
    <div className="pitch" aria-hidden="true">
      {phrases.map((phrase, pi) => (
        <PhraseCurve key={pi} phrase={phrase} />
      ))}
    </div>
  );
}

const W = 22; // 每拍宽度
const HIGH = 9;
const LOW = 25;

function PhraseCurve({ phrase }: { phrase: AccentPhrase }) {
  const n = phrase.moras.length;
  if (n === 0) return null;

  // 标准规则：1型首拍高、其余下降；平板型与其他型首拍低、第二拍起高，
  // 到降核为止
  const high = (i: number) => {
    if (phrase.accent === 1) return i === 0;
    if (phrase.accent === 0) return i > 0;
    return i > 0 && i < phrase.accent;
  };

  const width = n * W + 10;
  const x = (i: number) => i * W + 10;
  const y = (i: number) => (high(i) ? HIGH : LOW);

  const line = phrase.moras.map((_, i) => `${x(i)},${y(i)}`).join(" ");

  return (
    <svg
      className="pitch-svg"
      viewBox={`0 0 ${width} 46`}
      width={width}
      height="46"
      role="img"
    >
      <polyline
        points={line}
        fill="none"
        stroke="var(--ai)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {phrase.moras.map((m, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(i)} r="3.1" fill="var(--ai)" />
          <text
            x={x(i)}
            y="42"
            textAnchor="middle"
            fontSize="12"
            fill="var(--ink-soft)"
            fontFamily="var(--f-gothic)"
          >
            {m.text}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** 「平板型」「3型」这种说法，配合曲线给出文字结论。 */
export function accentName(phrases: AccentPhrase[]): string | null {
  if (phrases.length !== 1) return null;
  const { accent, moras } = phrases[0];
  if (accent === 0) return "平板型";
  if (accent === 1) return "頭高型";
  if (accent === moras.length) return "尾高型";
  return `中高型 · ${accent}型`;
}
