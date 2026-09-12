/**
 * 朗读用浏览器自带的 Web Speech API：不联网、不花钱、iOS/Android/桌面都有。
 * 代价是音色由系统决定，且日语语音要用户装了才有 —— 没有就把听力模式关掉。
 */

let cached: SpeechSynthesisVoice | null | undefined;

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window
    ? window.speechSynthesis
    : null;
}

/** 各平台的标准日语播音音色，优先用这些。 */
const PREFERRED = ["kyoko", "otoya", "hattori", "o-ren", "google 日本語", "japanese"];

/**
 * macOS/iOS 自带一批「新奇音色」（Grandma、Rocko、Bubbles…），
 * 每种语言都有一份，音调夸张，拿来练听力会误导。排掉。
 */
const NOVELTY = [
  "eddy", "flo", "grandma", "grandpa", "reed", "rocko", "sandy", "shelley",
  "bubbles", "bells", "boing", "jester", "organ", "superstar", "trinoids",
  "whisper", "wobble", "zarvox", "albert", "bad news", "good news", "cellos",
];

function isNovelty(name: string): boolean {
  const n = name.toLowerCase();
  return NOVELTY.some((bad) => n.includes(bad));
}

/** 挑一个日语语音。voices 是异步填充的，拿不到就下次再问。 */
export function japaneseVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  if (cached !== undefined) return cached;

  const voices = s.getVoices();
  if (voices.length === 0) return null; // 还没加载好，不要记住这个结果

  const ja = voices.filter((v) => v.lang.toLowerCase().startsWith("ja"));
  const named = (needle: string) =>
    ja.find((v) => v.name.toLowerCase().includes(needle));

  cached =
    PREFERRED.map(named).find(Boolean) ??
    // 其次是任何非新奇的本地音色，联网语音在弱网下会卡住
    ja.find((v) => v.localService && !isNovelty(v.name)) ??
    ja.find((v) => !isNovelty(v.name)) ??
    ja[0] ??
    null;
  return cached;
}

/** 当前用的是哪个音色，显示在界面上好让人知道听的是谁。 */
export function voiceName(): string | null {
  return japaneseVoice()?.name ?? null;
}

/** 系统里所有可用的日语音色，供用户自己换。 */
export function japaneseVoices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  return s.getVoices().filter((v) => v.lang.toLowerCase().startsWith("ja"));
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
