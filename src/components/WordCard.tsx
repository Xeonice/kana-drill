import type { Word } from "../types";

type Props = {
  word: Word;
  revealed: boolean;
  onReveal: () => void;
  onJudge: (ok: boolean) => void;
};

export function WordCard({ word, revealed, onReveal, onJudge }: Props) {
  // 片假名外来语的「汉字」就是它本身，重复展示没有意义
  const showKanji = word.kanji !== word.kana;

  return (
    <div className="card">
      <div className="kana-note">この仮名の漢字と意味は？</div>
      <p className="kana">{word.kana}</p>

      {revealed && (
        <div className="answer">
          {showKanji && <p className="kanji">{word.kanji}</p>}
          <div className="gloss">{word.gloss}</div>
          {word.example && <div className="example">{word.example}</div>}
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
