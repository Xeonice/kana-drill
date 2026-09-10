import type { Archive, Card, Session } from "../types";
import { BOX_LABEL, daysUntilDue } from "../lib/archive";

type Props = {
  cards: Card[];
  session: Session;
  archive: Archive;
  missedCards: Card[];
  onFinish: () => void;
};

export function DoneCard({ cards, session, archive, missedCards, onFinish }: Props) {
  const total = cards.length;
  const clean = total - missedCards.length;

  // 这次之后，下一批到期是几天以后
  const nextDue = cards
    .map((c) => archive.stats[c.key])
    .filter(Boolean)
    .map((s) => daysUntilDue(s))
    .filter((d) => d > 0)
    .sort((a, b) => a - b)[0];

  return (
    <div className="card">
      <div className="done">
        <div className="seal">全巡了</div>
        <p>
          {total} 語すべて正解になりました。共 {session.round} 巡。
          <br />
          一次就想起来的 {clean} 个
          {missedCards.length > 0 ? `，想不起来过的 ${missedCards.length} 个已经掉回第 1 级。` : "，全对。"}
        </p>

        {missedCards.length > 0 && (
          <ul className="recap">
            {missedCards.slice(0, 8).map((c) => (
              <li key={c.key}>
                <span className="recap-kana">{c.kana}</span>
                <span className="recap-kanji">{c.kanji === c.kana ? "—" : c.kanji}</span>
                <span className="recap-gloss">{c.gloss}</span>
                <span className="recap-n">{session.missed[c.key]}</span>
              </li>
            ))}
            {missedCards.length > 8 && (
              <li className="recap-more">还有 {missedCards.length - 8} 个，见下方単語台帳</li>
            )}
          </ul>
        )}

        <p className="done-next">
          {nextDue !== undefined
            ? `下一批到期在 ${nextDue} 天后 · 最高等级「${BOX_LABEL[5]}」间隔 14 天`
            : "今天练过的词明天还会再出现一次"}
        </p>

        <div className="actions actions-done">
          <button type="button" onClick={onFinish}>
            回到首页
          </button>
        </div>
      </div>
    </div>
  );
}
