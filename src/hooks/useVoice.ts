import { useCallback, useEffect, useState } from "react";
import { japaneseVoices, setVoice, speak, voiceName } from "../lib/speech";
import { qualityOf, type Quality } from "../lib/voiceQuality";

const KEY = "kana-drill:voice";

export type VoiceOption = {
  name: string;
  quality: Quality;
};

/**
 * 音色选择。系统里的日语语音质量参差，自动挑的是当前能拿到的最好一档，
 * 但更好的往往要用户自己去系统设置里下载 —— 所以把音质档位摆在界面上。
 */
export function useVoice(canSpeak: boolean) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
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

    const available = japaneseVoices().map((v) => ({
      name: v.name,
      quality: qualityOf(v.name),
    }));
    setVoices(available);

    if (saved && available.some((v) => v.name === saved)) {
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

  const quality = current ? qualityOf(current) : null;

  return { voices, current, quality, choose, preview };
}
