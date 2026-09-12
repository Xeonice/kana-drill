import { useState } from "react";
import type { Archive, Box, Card, Mode } from "../types";
import { ALL_CARDS } from "../data";
import { BOX_LABEL, MODE_LABEL, MODE_SHORT, MODES, daysUntilDue, statKey } from "../lib/archive";
import { usableInMode } from "../lib/session";

type Props = {
  archive: Archive;
  onExport: () => void;
};

type Filter = "weak" | "all";

/** 一个词在某模式下的等级；没练过返回 0。 */
function boxOf(archive: Archive, card: Card, mode: Mode): Box | 0 {
  return archive.stats[statKey(card.key, mode)]?.box ?? 0;
}

/** 练过的模式里最低的那一级，用来排序和筛弱项。 */
function weakest(archive: Archive, card: Card): number {
  const seen = MODES.map((m) => boxOf(archive, card, m)).filter((b) => b > 0);
  return seen.length > 0 ? Math.min(...seen) : 0;
}

function everSeen(archive: Archive, card: Card): boolean {
  return MODES.some((m) => boxOf(archive, card, m) > 0);
}

export function Ledger({ archive, onExport }: Props) {
  const [filter, setFilter] = useState<Filter>("weak");

  const seen = ALL_CARDS.filter((c) => everSeen(archive, c));
  const rows = (filter === "weak" ? seen.filter((c) => weakest(archive, c) <= 2) : seen).sort(
    (a, b) => weakest(archive, a) - weakest(archive, b),
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
                {MODES.map((m) => (
                  <th key={m} title={MODE_LABEL[m]}>
                    {MODE_SHORT[m]}
                  </th>
                ))}
                <th className="r-n">次回</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.key}>
                  <td className="r-kana">{c.kana}</td>
                  <td className="r-kanji">{c.kanji === c.kana ? "—" : c.kanji}</td>
                  <td>{c.gloss}</td>
                  {MODES.map((m) => (
                    <td key={m}>
                      <ModeCell archive={archive} card={c} mode={m} />
                    </td>
                  ))}
                  <td className="r-n r-due">{nextDue(archive, c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** 三种模式里最早该复习的那天。 */
function nextDue(archive: Archive, card: Card): string {
  const days = MODES.map((m) => archive.stats[statKey(card.key, m)])
    .filter(Boolean)
    .map((s) => daysUntilDue(s!));
  if (days.length === 0) return "—";
  const soonest = Math.min(...days);
  return soonest <= 0 ? "今日" : `${soonest}日後`;
}

function ModeCell({ archive, card, mode }: { archive: Archive; card: Card; mode: Mode }) {
  if (!usableInMode(card, mode)) {
    return <span className="meter-na" title="片假名外来语，这个模式不考它">—</span>;
  }
  const box = boxOf(archive, card, mode);
  if (box === 0) {
    return <span className="meter-na" title="还没在这个模式下练过">·</span>;
  }
  return (
    <span className={`meter meter-${box}`} title={`${MODE_LABEL[mode]}：${BOX_LABEL[box]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= box ? "on" : ""} />
      ))}
    </span>
  );
}
