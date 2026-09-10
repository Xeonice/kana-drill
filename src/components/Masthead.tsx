import type { Phase } from "../hooks/useDrill";

type Props = {
  deckCount: number;
  wordCount: number;
  phase: Phase;
  round: number;
  remaining: number;
};

export function Masthead({ deckCount, wordCount, phase, round, remaining }: Props) {
  return (
    <header className="masthead">
      <div>
        <h1>仮名から引く</h1>
        <div className="sub">
          {deckCount} 日分 · 単語 {wordCount}
        </div>
      </div>
      <div className="roundtag">
        {phase === "drill" ? `第 ${round} 巡 · 残り ${remaining}` : phase === "done" ? "全巡了" : "待機中"}
      </div>
    </header>
  );
}
