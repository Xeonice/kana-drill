import { useState } from "react";
import type { Theme } from "../hooks/useTheme";
import type { Phase } from "../hooks/useDrill";

type Props = {
  status: string;
  phase: Phase;
  onShuffle: () => void;
  onQuit: () => void;
  onResetArchive: () => void;
  theme: Theme;
  onCycleTheme: () => void;
};

const THEME_LABEL: Record<Theme, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

export function Toolbar({
  status,
  phase,
  onShuffle,
  onQuit,
  onResetArchive,
  theme,
  onCycleTheme,
}: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <footer className="footer">
      <span className="sync">{status}</span>
      <div className="tools">
        <button type="button" onClick={onCycleTheme}>
          {THEME_LABEL[theme]}
        </button>

        {phase === "drill" && (
          <>
            <button type="button" onClick={onShuffle}>
              打乱顺序
            </button>
            <button type="button" onClick={onQuit}>
              中断
            </button>
          </>
        )}

        {phase === "start" &&
          (confirming ? (
            <>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  onResetArchive();
                  setConfirming(false);
                }}
              >
                确定清空全部熟练度
              </button>
              <button type="button" onClick={() => setConfirming(false)}>
                取消
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)}>
              清空档案
            </button>
          ))}
      </div>
    </footer>
  );
}
