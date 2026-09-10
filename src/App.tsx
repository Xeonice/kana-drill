import { useCallback, useEffect, useRef, useState } from "react";
import { day3 } from "./data/day3";
import { useDrill } from "./hooks/useDrill";
import { useTheme } from "./hooks/useTheme";
import { copyText, wrongListToMarkdown } from "./lib/exportWrong";
import { DoneCard } from "./components/DoneCard";
import { Ledger } from "./components/Ledger";
import { Masthead } from "./components/Masthead";
import { ProgressBoard } from "./components/ProgressBoard";
import { Toolbar } from "./components/Toolbar";
import { WordCard } from "./components/WordCard";

const deck = day3;
const IDLE_STATUS = "進捗はこの端末に保存されます";

export default function App() {
  const {
    progress,
    current,
    revealed,
    finished,
    counts,
    wrongList,
    judge,
    reveal,
    shuffle,
    reset,
    retryWrong,
  } = useDrill(deck);

  const { theme, cycle } = useTheme();
  const [status, setStatus] = useState(IDLE_STATUS);
  const statusTimer = useRef<number | undefined>(undefined);

  const flash = useCallback((text: string) => {
    setStatus(text);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(IDLE_STATUS), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  // 空格翻面，左右方向键判定
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (finished) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!revealed) reveal();
        return;
      }
      if (!revealed) return;
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
  }, [finished, revealed, reveal, judge]);

  const handleExport = useCallback(async () => {
    const ok = await copyText(wrongListToMarkdown(wrongList, progress));
    flash(ok ? "錯題帳已复制为 Markdown" : "复制失败，请手动选中表格");
  }, [wrongList, progress, flash]);

  const handleReset = useCallback(() => {
    reset();
    flash("已清空进度，从头再来");
  }, [reset, flash]);

  const handleShuffle = useCallback(() => {
    shuffle();
    flash("剩下的词已打乱");
  }, [shuffle, flash]);

  return (
    <div className="wrap">
      <Masthead
        title={deck.title}
        subtitle={deck.subtitle}
        round={progress.round}
        remaining={counts.todo}
        finished={finished}
      />

      <ProgressBoard
        words={deck.words}
        progress={progress}
        currentId={current ? current.id : null}
        counts={counts}
      />

      <main>
        {current ? (
          <WordCard word={current} revealed={revealed} onReveal={reveal} onJudge={judge} />
        ) : (
          <DoneCard
            total={deck.words.length}
            rounds={progress.round}
            missedCount={wrongList.length}
            onRetryWrong={retryWrong}
            onResetAll={handleReset}
          />
        )}
      </main>

      <Ledger rows={wrongList} progress={progress} onExport={handleExport} />

      <Toolbar
        status={status}
        onShuffle={handleShuffle}
        onReset={handleReset}
        theme={theme}
        onCycleTheme={cycle}
      />
    </div>
  );
}
