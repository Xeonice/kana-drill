/**
 * 朗读用浏览器自带的 Web Speech API：不联网、不花钱、iOS/Android/桌面都有。
 * 代价是音色由系统决定，且日语语音要用户装了才有 —— 没有就把听力模式关掉。
 */

import { byQuality, excluded, qualityOf, type Quality } from "./voiceQuality";

let cached: SpeechSynthesisVoice | null | undefined;

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;
}

/** 系统里所有可用的日语音色，去掉玩具与极低质量的，好的排前面。 */
export function japaneseVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const ja = s.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
  const usable = ja.filter((v) => !excluded(v.name));
  // 全被过滤光了就退回原始列表，总比没得读强
  return (usable.length > 0 ? usable : ja).sort(byQuality);
}

/** 挑音质最好的那个。voices 是异步填充的，拿不到就下次再问。 */
export function japaneseVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  if (cached !== undefined) return cached;

  const voices = s.getVoices();
  if (voices.length === 0) return null; // 还没加载好，不要记住这个结果

  cached = japaneseVoices()[0] ?? null;
  return cached;
}

/** 当前用的是哪个音色。 */
export function voiceName(): string | null {
  return japaneseVoice()?.name ?? null;
}

/** 当前音色的音质档位，用于提示还能不能更好。 */
export function currentQuality(): Quality | null {
  const v = japaneseVoice();
  return v ? qualityOf(v.name) : null;
}

/** 指定音色，null 表示恢复自动挑选。 */
export function setVoice(name: string | null): void {
  if (name === null) {
    cached = undefined;
    return;
  }
  const found = japaneseVoices().find((v) => v.name === name);
  if (found) cached = found;
}

/** 语音列表就绪后回调一次，用于把听力模式从禁用状态点亮。 */
export function onVoicesReady(fn: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  const handler = () => {
    cached = undefined; // 重新挑一次
    fn();
  };
  s.addEventListener("voiceschanged", handler);
  return () => s.removeEventListener("voiceschanged", handler);
}

export function speechAvailable(): boolean {
  return japaneseVoice() !== null;
}

/**
 * 读一段日语。会打断上一段 —— 连点朗读按钮时不该排队播放。
 *
 * 传汉字表记，别传纯假名：TTS 靠汉字查词典才拿得到正确的音调，
 * 喂一串平假名它既分不了词也查不到 accent，只能平读或猜错。
 */
export function speak(text: string, rate = 1): void {
  const s = synth();
  if (!s || !text) return;

  const voice = japaneseVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "ja-JP";
  if (voice) utterance.voice = voice;
  utterance.rate = rate;

  s.cancel();
  s.speak(utterance);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
