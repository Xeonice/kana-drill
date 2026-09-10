import { useCallback, useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

const KEY = "kana-drill:theme";
const ORDER: Theme[] = ["system", "light", "dark"];

function read(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // 存储不可用时跟随系统
  }
  return "system";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(read());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // 记不住就每次跟随系统，不影响使用
    }
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((t) => ORDER[(ORDER.indexOf(t) + 1) % ORDER.length]);
  }, []);

  return { theme, cycle };
}
