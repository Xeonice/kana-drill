import { useState } from "react";
import type { Archive, Box } from "../types";
import { ALL_CARDS } from "../data";
import { BOX_LABEL, daysUntilDue } from "../lib/archive";

type Props = {
  archive: Archive;
  onExport: () => void;
};

type Filter = "weak" | "all";

export function Ledger({ archive, onExport }: Props) {
  const [filter, setFilter] = useState<Filter>("weak");

  const seen = ALL_CARDS.filter((c) => archive.stats[c.key]);
  const rows = (filter === "weak" ? seen.filter((c) => archive.stats[c.key]!.box <= 2) : seen).sort(
    (a, b) => {
      const sa = archive.stats[a.key]!;
      const sb = archive.stats[b.key]!;
      return sa.box - sb.box || sb.wrong - sa.wrong;
    },
  );

  return (
    <section className="ledger">
      <div className="ledger-head">
        <h2>単語台帳</h2>
        <div className="ledger-tools">
          <button
            type="button"
            className={filter === "weak" ? "link on" : "link"}
            onClick={() => setFilter("weak")}
          >
            苦手だけ
          </button>
          <button
            type="button"
            className={filter === "all" ? "link on" : "link"}
            onClick={() => setFilter("all")}
          >
            全部（{seen.length}）
          </button>
          {rows.length > 0 && (
            <button type="button" className="link" onClick={onExport}>
              复制为 Markdown
            </button>
          )}
        </div>
      </div>

      {seen.length === 0 ? (
        <div className="empty">还没有记录 —— 练过的词会带着熟练度落在这里，跨天累积。</div>
      ) : rows.length === 0 ? (
        <div className="empty">没有等级 1-2 的词了，全部进入了复习巡回。</div>
      ) : (
        <div className="ledger-scroll">
          <table>
            <thead>
              <tr>
                <th>仮名</th>
                <th>漢字</th>
                <th>釈義</th>
                <th>熟練度</th>
                <th className="r-n">誤</th>
                <th className="r-n">次回</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const stat = archive.stats[c.key]!;
                const days = daysUntilDue(stat);
                return (
                  <tr key={c.key}>
                    <td className="r-kana">{c.kana}</td>
                    <td className="r-kanji">{c.kanji === c.kana ? "—" : c.kanji}</td>
                    <td>{c.gloss}</td>
                    <td>
                      <BoxMeter box={stat.box} />
                    </td>
                    <td className="r-n">{stat.wrong}</td>
                    <td className="r-n r-due">{days <= 0 ? "今日" : `${days}日後`}</td>
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

function BoxMeter({ box }: { box: Box }) {
  return (
    <span className={`meter meter-${box}`} title={BOX_LABEL[box]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= box ? "on" : ""} />
      ))}
      <span className="meter-label">{BOX_LABEL[box]}</span>
    </span>
  );
}
