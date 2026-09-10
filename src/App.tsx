import { useCallback, useEffect, useRef, useState } from "react";
import { ALL_CARDS, DECKS } from "./data";
import { useDrill } from "./hooks/useDrill";
import { useTheme } from "./hooks/useTheme";
import { copyText, ledgerToMarkdown } from "./lib/exportWrong";
import { DoneCard } from "./components/DoneCard";
import { Ledger } from "./components/Ledger";
import { Masthead } from "./components/Masthead";
import { ProgressBoard } from "./components/ProgressBoard";
import { StartPanel } from "./components/StartPanel";
import { Toolbar } from "./components/Toolbar";
import { WordCard } from "./components/WordCard";

const IDLE_STATUS = "熟練度はこの端末に保存されます";

export default function App() {
  const drill = useDrill();
  const { theme, cycle } = useTheme();
  const [status, setStatus] = useState(IDLE_STATUS);
  const statusTimer = useRef<number | undefined>(undefined);

  const flash = useCallback((text: string) => {
    setStatus(text);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(IDLE_STATUS), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  const { phase, revealed, reveal, judge, begin } = drill;

  // 空格翻面 / 开始，左右方向键判定
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "start") begin();
        else if (phase === "drill" && !revealed) reveal();
        return;
      }
      if (phase !== "drill" || !revealed) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        judge(true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        judge(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, reveal, judge, begin]);

  const handleExport = useCallback(async () => {
    const seen = ALL_CARDS.filter((c) => drill.archive.stats[c.key]);
    const ok = await copyText(ledgerToMarkdown(seen, drill.archive));
    flash(ok ? `単語台帳已复制（${seen.length} 语）` : "复制失败，请手动选中表格");
  }, [drill.archive, flash]);

  const handleShuffle = useCallback(() => {
    drill.shuffleRest();
    flash("剩下的词已打乱");
  }, [drill, flash]);

  const handleResetArchive = useCallback(() => {
    drill.resetArchive();
    flash("已清空全部熟练度");
  }, [drill, flash]);

  return (
    <div className="wrap">
      <Masthead
        deckCount={DECKS.length}
        wordCount={ALL_CARDS.length}
        phase={phase}
        round={drill.session?.round ?? 1}
        remaining={drill.counts.todo}
      />

      {drill.session && phase !== "start" && (
        <ProgressBoard
          cards={drill.cards}
          session={drill.session}
          currentKey={drill.current?.key ?? null}
          counts={drill.counts}
        />
      )}

      <main>
        {phase === "start" && (
          <StartPanel
            plan={drill.plan}
            archive={drill.archive}
            deckIds={drill.deckIds}
            size={drill.size}
            onToggleDeck={drill.toggleDeck}
            onSelectAll={drill.selectAllDecks}
            onSetSize={drill.setSize}
            onBegin={drill.begin}
          />
        )}

        {phase === "drill" && drill.current && drill.session && (
          <WordCard
            card={drill.current}
            origin={drill.session.origins[drill.current.key]}
            stat={drill.archive.stats[drill.current.key]}
            revealed={drill.revealed}
            onReveal={drill.reveal}
            onJudge={drill.judge}
          />
        )}

        {phase === "done" && drill.session && (
          <DoneCard
            cards={drill.cards}
            session={drill.session}
            archive={drill.archive}
            missedCards={drill.missedCards}
            onFinish={drill.endSession}
          />
        )}
      </main>

      <Ledger archive={drill.archive} onExport={handleExport} />

      <Toolbar
        status={status}
        phase={phase}
        onShuffle={handleShuffle}
        onQuit={drill.endSession}
        onResetArchive={handleResetArchive}
        theme={theme}
        onCycleTheme={cycle}
      />
    </div>
  );
}
