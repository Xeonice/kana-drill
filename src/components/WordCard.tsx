import { useEffect } from "react";
import type { Card, Mode, Origin, WordStat } from "../types";
import { BOX_LABEL, MODE_SHORT } from "../lib/archive";
import { speak } from "../lib/speech";

type Props = {
  card: Card;
  mode: Mode;
  origin: Origin | undefined;
  stat: WordStat | undefined;
  revealed: boolean;
  canSpeak: boolean;
  onReveal: () => void;
  onJudge: (ok: boolean) => void;
};

const ORIGIN_LABEL: Record<Origin, string> = {
  new: "新出",
  review: "要復習",
  check: "定着確認",
};

const PROMPT: Record<Mode, string> = {
  kana: "この仮名の漢字と意味は？",
  kanji: "この漢字の読みと意味は？",
  audio: "聞こえた語の漢字と意味は？",
};

export function WordCard({
  card,
  mode,
  origin,
  stat,
  revealed,
  canSpeak,
  onReveal,
  onJudge,
}: Props) {
  // 片假名外来语没有另一面的汉字，答案里就不重复列了
  const hasKanji = card.kanji !== card.kana;

  // 朗读喂汉字表记而不是假名：引擎靠汉字查词典才有正确音调。
  // 片假名外来语的 kanji 就是它本身，照样正确。
  const spoken = card.kanji;

  // 听力模式：换一张卡就先念一遍，省得每次都要点
  useEffect(() => {
    if (mode === "audio" && canSpeak && !revealed) speak(spoken);
  }, [mode, canSpeak, revealed, spoken]);

  return (
    <div className="card">
      <div className="card-tags">
        <span className="tag">{card.deckLabel}</span>
        <span className="tag tag-mode">{MODE_SHORT[mode]}</span>
        {origin && <span className={`tag tag-${origin}`}>{ORIGIN_LABEL[origin]}</span>}
        {stat && <span className="tag tag-box">{BOX_LABEL[stat.box]}</span>}
      </div>

      <div className="kana-note">{PROMPT[mode]}</div>

      {mode === "audio" ? (
        <div className="listen">
          <button
            type="button"
            className="speak-big"
            onClick={() => speak(spoken)}
            aria-label="もう一度聞く"
          >
            <SoundIcon />
            <span>もう一度</span>
          </button>
        </div>
      ) : (
        <p className="kana">{mode === "kana" ? card.kana : card.kanji}</p>
      )}

      {revealed && (
        <div className="answer">
          {mode === "kana" && hasKanji && <p className="kanji">{card.kanji}</p>}
          {mode === "kanji" && <p className="kanji">{card.kana}</p>}
          {mode === "audio" && (
            <>
              <p className="kana answer-kana">{card.kana}</p>
              {hasKanji && <p className="kanji">{card.kanji}</p>}
            </>
          )}

          <div className="gloss">{card.gloss}</div>

          {canSpeak && (
            <div className="speak-row">
              <button type="button" className="speak" onClick={() => speak(spoken)}>
                <SoundIcon />
                単語を読む
              </button>
              {card.example && (
                <button type="button" className="speak" onClick={() => speak(card.example)}>
                  <SoundIcon />
                  例文を読む
                </button>
              )}
            </div>
          )}

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

function SoundIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 9.5v5h3.2L12 19V5L7.2 9.5H4z"
        fill="currentColor"
      />
      <path
        d="M15.5 8.8a4.2 4.2 0 0 1 0 6.4M18.2 6a7.8 7.8 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
