import { useCallback, useEffect, useState } from "react";
import { japaneseVoices, setVoice, speak, voiceName } from "../lib/speech";

const KEY = "kana-drill:voice";

/**
 * 音色选择。系统里的日语语音质量参差（macOS 的 Grandma、Rocko 之类是
 * 新奇音色，音调夸张），自动挑选挑不准时让人自己换一个。
 */
export function useVoice(canSpeak: boolean) {
  const [voices, setVoices] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!canSpeak) return;
    const saved = (() => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    })();

    const available = japaneseVoices().map((v) => v.name);
    setVoices(available);

    if (saved && available.includes(saved)) {
      setVoice(saved);
      setCurrent(saved);
    } else {
      setCurrent(voiceName());
    }
  }, [canSpeak]);

  const choose = useCallback((name: string) => {
    setVoice(name);
    setCurrent(name);
    try {
      localStorage.setItem(KEY, name);
    } catch {
      // 记不住就每次自动挑，不影响使用
    }
  }, []);

  /** 换音色时念一句样本，直接听出差别。 */
  const preview = useCallback((text = "向上") => speak(text), []);

  return { voices, current, choose, preview };
}
