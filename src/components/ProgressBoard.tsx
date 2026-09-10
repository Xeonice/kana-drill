import type { Card, Session } from "../types";
import type { Counts } from "../hooks/useDrill";

type Props = {
  cards: Card[];
  session: Session;
  currentKey: string | null;
  counts: Counts;
};

export function ProgressBoard({ cards, session, currentKey, counts }: Props) {
  return (
    <section className="board">
      <div className="grid" style={{ "--cols": Math.min(20, Math.max(10, cards.length)) } as React.CSSProperties}>
        {cards.map((c) => {
          const classes = ["cell"];
          if (session.mastered[c.key]) classes.push("ok");
          else if ((session.missed[c.key] ?? 0) > 0) classes.push("miss");
          if (c.key === currentKey) classes.push("now");
          return <div key={c.key} className={classes.join(" ")} title={`${c.deckLabel} · ${c.kana}`} />;
        })}
      </div>
      <div className="legend">
        <span>
          <span className="dot dot-ok" />
          已答对 <b>{counts.ok}</b>
        </span>
        <span>
          <span className="dot dot-miss" />
          待重来 <b>{counts.miss}</b>
        </span>
        <span>
          <span className="dot dot-todo" />
          未过 <b>{counts.todo}</b>
        </span>
      </div>
    </section>
  );
}
