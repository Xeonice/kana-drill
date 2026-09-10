import type { Counts } from "../hooks/useDrill";
import type { Progress, Word } from "../types";

type Props = {
  words: Word[];
  progress: Progress;
  currentId: number | null;
  counts: Counts;
};

export function ProgressBoard({ words, progress, currentId, counts }: Props) {
  return (
    <section className="board">
      <div className="grid">
        {words.map((w) => {
          const classes = ["cell"];
          if (progress.mastered[w.id]) classes.push("ok");
          else if ((progress.wrong[w.id] ?? 0) > 0) classes.push("miss");
          if (w.id === currentId) classes.push("now");
          return <div key={w.id} className={classes.join(" ")} title={w.kana} />;
        })}
      </div>
      <div className="legend">
        <span>
          <span className="dot dot-ok" />
          已掌握 <b>{counts.ok}</b>
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
