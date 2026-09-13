import accents from "../data/accents.json";
import { speak as speakSystem, stopSpeaking as stopSystem } from "./speech";

/**
 * 朗读的两条通路：
 * - clip：预生成的 VOICEVOX 音频（scripts/generate-voices.mjs 烤出来的）
 * - system：浏览器自带的 Web Speech API
 *
 * 词库是固定集合，音频提前生成好当静态资源发出去 —— 无服务器、无延迟、
 * 离线可用、跨设备音质一致。新加的词还没跑生成脚本时退回系统语音，
 * 不至于哑掉。
 */
export type TtsSource = "clip" | "system";

/** 一个 mora 的读音与音高 */
export type Mora = { text: string; pitch: number };

/** 一个音调短语：moras 加重音核位置（0 为平板型） */
export type AccentPhrase = { accent: number; moras: Mora[] };

const ACCENTS = accents as Record<string, AccentPhrase[]>;

/** 音频文件名是文本的 sha256 前 16 位，与生成脚本保持一致。 */
async function idOf(text: string): Promise<string | null> {
  // crypto.subtle 只在安全上下文可用；不可用时就走系统语音
  if (!globalThis.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

/** 词库里有没有预生成的音频，有的话听力模式不依赖系统语音。 */
export function hasClips(): boolean {
  return Object.keys(ACCENTS).length > 0;
}

/** 这段文本有没有预生成的音高数据。 */
export function accentsOf(text: string): AccentPhrase[] | null {
  return ACCENTS[text] ?? null;
}

let audio: HTMLAudioElement | null = null;

function stopClip() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}

/**
 * 读一段日语。有预生成音频就播它，否则退回系统语音。
 * 返回实际走了哪条通路，让界面能如实说明。
 */
export async function speak(text: string): Promise<TtsSource> {
  if (!text) return "system";
  stop();

  // 没有音高数据说明这句话没被生成过，不必白跑一趟网络请求
  if (ACCENTS[text]) {
    const id = await idOf(text);
    if (id) {
      try {
        const el = new Audio(`${import.meta.env.BASE_URL}audio/${id}.m4a`);
        audio = el;
        await el.play();
        return "clip";
      } catch {
        // 文件缺失或浏览器拦了自动播放，落到系统语音
        audio = null;
      }
    }
  }

  speakSystem(text);
  return "system";
}

export function stop(): void {
  stopClip();
  stopSystem();
}
