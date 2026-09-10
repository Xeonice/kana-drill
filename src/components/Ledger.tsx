import type { Progress, Word } from "../types";

type Props = {
  rows: Word[];
  progress: Progress;
  onExport: () => void;
};

export function Ledger({ rows, progress, onExport }: Props) {
  return (
    <section className="ledger">
      <div className="ledger-head">
        <h2>錯題帳</h2>
        {rows.length > 0 && (
          <button type="button" className="link" onClick={onExport}>
            复制为 Markdown
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="empty">还没有记录 —— 答错的词会自动落在这里，并排到下一巡。</div>
      ) : (
        <div className="ledger-scroll">
          <table>
            <thead>
              <tr>
                <th>仮名</th>
                <th>漢字</th>
                <th>釈義</th>
                <th className="r-n">誤</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const times = progress.wrong[w.id] ?? 0;
                const done = progress.mastered[w.id];
                return (
                  <tr key={w.id}>
                    <td className="r-kana">{w.kana}</td>
                    <td className="r-kanji">{w.kanji === w.kana ? "—" : w.kanji}</td>
                    <td>{w.gloss}</td>
                    <td className={done ? "r-n r-n-done" : "r-n"}>
                      {done ? `${times} ✓` : times}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
