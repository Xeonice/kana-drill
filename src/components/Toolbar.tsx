type Props = {
  status: string;
  onShuffle: () => void;
  onReset: () => void;
  theme: "system" | "light" | "dark";
  onCycleTheme: () => void;
};

const THEME_LABEL: Record<Props["theme"], string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

export function Toolbar({ status, onShuffle, onReset, theme, onCycleTheme }: Props) {
  return (
    <footer className="footer">
      <span className="sync">{status}</span>
      <div className="tools">
        <button type="button" onClick={onCycleTheme}>
          {THEME_LABEL[theme]}
        </button>
        <button type="button" onClick={onShuffle}>
          打乱顺序
        </button>
        <button type="button" onClick={onReset}>
          全部重来
        </button>
      </div>
    </footer>
  );
}
