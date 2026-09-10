import type { Archive } from "../types";
import type { Plan, Size } from "../lib/session";
import { DECKS } from "../data";
import { SIZE_HINT, SIZE_LABEL } from "../lib/session";

type Props = {
  plan: Plan;
  archive: Archive;
  deckIds: string[];
  size: Size;
  onToggleDeck: (id: string) => void;
  onSelectAll: () => void;
  onSetSize: (size: Size) => void;
  onBegin: () => void;
};

const SIZES: Size[] = ["light", "normal", "full"];

export function StartPanel({
  plan,
  archive,
  deckIds,
  size,
  onToggleDeck,
  onSelectAll,
  onSetSize,
  onBegin,
}: Props) {
  const seen = Object.keys(archive.stats).length;
  const allSelected = deckIds.length === DECKS.length;

  const rows = [
    { label: "新出", hint: "还没见过", cards: plan.new },
    { label: "要復習", hint: "上次没答对", cards: plan.review },
    { label: "定着確認", hint: "熟练度高，到期抽检", cards: plan.check },
  ].filter((r) => r.cards.length > 0);

  return (
    <div className="card start">
      <div className="start-head">
        <div className="kana-note">本日のおさらい</div>
        <p className="start-total">
          {plan.total}
          <span className="start-unit">語</span>
        </p>
      </div>

      {rows.length > 0 ? (
        <ul className="plan">
          {rows.map((r) => (
            <li key={r.label}>
              <span className="plan-label">{r.label}</span>
              <span className="plan-hint">{r.hint}</span>
              <span className="plan-decks">{deckSummary(r.cards.map((c) => c.deckLabel))}</span>
              <span className="plan-n">{r.cards.length}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="plan-empty">
          选中的词单今天都复习过了 —— 到期的会自动出现在这里。
          <br />
          想现在就全部再过一遍，把「量」切到「たっぷり」。
        </p>
      )}

      <div className="picker">
        <div className="picker-row">
          <span className="picker-label">範囲</span>
          <div className="chips">
            {DECKS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={deckIds.includes(d.id) ? "chip on" : "chip"}
                aria-pressed={deckIds.includes(d.id)}
                onClick={() => onToggleDeck(d.id)}
              >
                {d.label}
                <span className="chip-n">{d.words.length}</span>
              </button>
            ))}
            {!allSelected && (
              <button type="button" className="chip chip-all" onClick={onSelectAll}>
                全部
              </button>
            )}
          </div>
        </div>

        <div className="picker-row">
          <span className="picker-label">量</span>
          <div className="chips">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                className={s === size ? "chip on" : "chip"}
                aria-pressed={s === size}
                onClick={() => onSetSize(s)}
              >
                {SIZE_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <p className="picker-hint">{SIZE_HINT[size]}</p>
      </div>

      <div className="spacer" />

      <div className="actions">
        <button type="button" className="btn-reveal" onClick={onBegin} disabled={plan.total === 0}>
          開始
        </button>
      </div>
      <div className="hint">
        {seen > 0 ? `已建档 ${seen} 个词 · 答对升一级，答错掉回第 1 级` : "答对升一级，答错掉回第 1 级"}
      </div>
    </div>
  );
}

/** 把 ["Day 3","Day 3","Day 4"] 说成「Day 3・Day 4」，超过三天就省略 */
function deckSummary(labels: string[]): string {
  const uniq = Array.from(new Set(labels));
  if (uniq.length === 0) return "";
  if (uniq.length === 1) return uniq[0];
  if (uniq.length <= 3) return uniq.join("・");
  return "混在";
}
