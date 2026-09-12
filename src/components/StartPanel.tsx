import type { Archive, Mode } from "../types";
import type { Plan, Size } from "../lib/session";
import { DECKS } from "../data";
import { MODE_LABEL, MODES } from "../lib/archive";
import { SIZE_HINT, SIZE_LABEL } from "../lib/session";

type Props = {
  plan: Plan;
  archive: Archive;
  deckIds: string[];
  size: Size;
  mode: Mode;
  canSpeak: boolean;
  onToggleDeck: (id: string) => void;
  onSelectAll: () => void;
  onSetSize: (size: Size) => void;
  onSetMode: (mode: Mode) => void;
  onBegin: () => void;
  voices: string[];
  voice: string | null;
  onChooseVoice: (name: string) => void;
  onPreviewVoice: () => void;
};

const MODE_HINT: Record<Mode, string> = {
  kana: "看假名，回想汉字和意思 —— 写作场景",
  kanji: "看汉字，回想读音和意思 —— 阅读场景。片假名外来语不计入",
  audio: "只听声音，回想写法和意思 —— 听力场景",
};

const SIZES: Size[] = ["light", "normal", "full"];

export function StartPanel({
  plan,
  archive,
  deckIds,
  size,
  mode,
  canSpeak,
  onToggleDeck,
  onSelectAll,
  onSetSize,
  onSetMode,
  onBegin,
  voices,
  voice,
  onChooseVoice,
  onPreviewVoice,
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
          <span className="picker-label">形式</span>
          <div className="chips">
            {MODES.map((m) => {
              const blocked = m === "audio" && !canSpeak;
              return (
                <button
                  key={m}
                  type="button"
                  className={m === mode ? "chip on" : "chip"}
                  aria-pressed={m === mode}
                  disabled={blocked}
                  title={blocked ? "这台设备没有日语语音，装了之后可用" : undefined}
                  onClick={() => onSetMode(m)}
                >
                  {MODE_LABEL[m]}
                </button>
              );
            })}
          </div>
        </div>

        <p className="picker-hint">
          {MODE_HINT[mode]}
          {mode === "audio" && !canSpeak && " —— 这台设备没装日语语音，暂时用不了"}
        </p>

        {mode === "audio" && canSpeak && voices.length > 1 && (
          <div className="picker-row">
            <span className="picker-label">声</span>
            <div className="voice-pick">
              <select
                id="voice"
                value={voice ?? ""}
                onChange={(e) => onChooseVoice(e.target.value)}
                aria-label="朗读音色"
              >
                {voices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <button type="button" className="link" onClick={onPreviewVoice}>
                試聴
              </button>
            </div>
          </div>
        )}

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
