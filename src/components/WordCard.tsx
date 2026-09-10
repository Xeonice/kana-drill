import type { Card, Origin, WordStat } from "../types";
import { BOX_LABEL } from "../lib/archive";

type Props = {
  card: Card;
  origin: Origin | undefined;
  stat: WordStat | undefined;
  revealed: boolean;
  onReveal: () => void;
  onJudge: (ok: boolean) => void;
};

const ORIGIN_LABEL: Record<Origin, string> = {
  new: "新出",
  review: "要復習",
  check: "定着確認",
};

export function WordCard({ card, origin, stat, revealed, onReveal, onJudge }: Props) {
  // 片假名外来语的「汉字」就是它本身，重复展示没有意义
  const showKanji = card.kanji !== card.kana;

  return (
    <div className="card">
      <div className="card-tags">
        <span className="tag">{card.deckLabel}</span>
        {origin && <span className={`tag tag-${origin}`}>{ORIGIN_LABEL[origin]}</span>}
        {stat && <span className="tag tag-box">{BOX_LABEL[stat.box]}</span>}
      </div>

      <div className="kana-note">この仮名の漢字と意味は？</div>
      <p className="kana">{card.kana}</p>

      {revealed && (
        <div className="answer">
          {showKanji && <p className="kanji">{card.kanji}</p>}
          <div className="gloss">{card.gloss}</div>
          {card.example && <div className="example">{card.example}</div>}
        </div>
      )}

      <div className="spacer" />

      {revealed ? (
        <>
          <div className="actions">
            <button type="button" className="btn-miss" onClick={() => onJudge(false)}>
              <span>错误</span>
              <span className="key">← 想不起来</span>
            </button>
            <button type="button" className="btn-ok" onClick={() => onJudge(true)}>
              <span>正确</span>
              <span className="key">→ 想起来了</span>
            </button>
          </div>
          <div className="hint">答错的词会排进下一巡，直到全部答对</div>
        </>
      ) : (
        <>
          <div className="actions">
            <button type="button" className="btn-reveal" onClick={onReveal}>
              翻面 · 看答案
            </button>
          </div>
          <div className="hint">空格键翻面</div>
        </>
      )}
    </div>
  );
}
