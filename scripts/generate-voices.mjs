/**
 * 用本地 VOICEVOX 引擎把词库烤成静态音频 + 音高数据。
 *
 * 词库是固定的小集合，没必要为它常驻一个合成服务：
 * 预生成之后应用只播静态文件 —— 无服务器、无延迟、离线可用。
 *
 * 用法：
 *   docker run -d --name voicevox -p 50021:50021 \
 *     voicevox/voicevox_engine:cpu-arm64-latest   （Intel 机器去掉 -arm64）
 *   npm run voices
 */
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);

const ENGINE = process.env.VOICEVOX_URL ?? "http://127.0.0.1:50021";
/** No.7 アナウンス —— 中性播音腔，不是角色声 */
const SPEAKER = Number(process.env.VOICEVOX_SPEAKER ?? 30);

const ROOT = path.resolve(import.meta.dirname, "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const ACCENT_FILE = path.join(ROOT, "src", "data", "accents.json");

/** 音频文件名：文本的哈希，同一句话只生成一次。 */
function idOf(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * 从词库 TS 文件里抽出词条。
 * 这些文件结构简单（一行一个四元组），直接正则比引入打包器省事。
 */
async function readDecks() {
  const dir = path.join(ROOT, "src", "data", "decks");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".ts"));
  const words = [];

  for (const file of files.sort()) {
    const src = await readFile(path.join(dir, file), "utf8");
    const rows = src.match(/^\s*\["[\s\S]*?\],$/gm) ?? [];
    for (const row of rows) {
      const cells = [...row.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
        m[1].replace(/\\"/g, '"'),
      );
      if (cells.length < 3) continue;
      const [kana, kanji, , example = ""] = cells;
      words.push({ kana, kanji, example, deck: file.replace(/\.ts$/, "") });
    }
  }
  return words;
}

async function audioQuery(text) {
  const url = `${ENGINE}/audio_query?text=${encodeURIComponent(text)}&speaker=${SPEAKER}`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`audio_query ${res.status} for ${text}`);
  return res.json();
}

async function synthesize(query) {
  const res = await fetch(`${ENGINE}/synthesis?speaker=${SPEAKER}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!res.ok) throw new Error(`synthesis ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** WAV 转 AAC/m4a：Safari 与 iOS 都认，体积只有 wav 的几十分之一。 */
async function toM4a(wav, outPath) {
  const tmp = `${outPath}.wav`;
  await writeFile(tmp, wav);
  await run("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", tmp,
    "-c:a", "aac", "-b:a", "64k", "-ar", "24000", "-ac", "1",
    outPath,
  ]);
  await rm(tmp);
}

/** 只留读音与重音核，播放时用不到的参数不进仓库。 */
function slimAccents(query) {
  return (query.accent_phrases ?? []).map((ph) => ({
    accent: ph.accent,
    moras: ph.moras.map((m) => ({ text: m.text, pitch: Number(m.pitch.toFixed(2)) })),
  }));
}

async function main() {
  try {
    const ping = await fetch(`${ENGINE}/version`);
    console.log(`VOICEVOX ${(await ping.json())} @ ${ENGINE}，speaker=${SPEAKER}`);
  } catch {
    console.error(`连不上 VOICEVOX（${ENGINE}）。先起容器：`);
    console.error("  docker run -d --name voicevox -p 50021:50021 voicevox/voicevox_engine:cpu-arm64-latest");
    process.exit(1);
  }

  const words = await readDecks();
  await mkdir(AUDIO_DIR, { recursive: true });

  // 同一句话在多个词单里出现时只生成一次
  const texts = new Map();
  for (const w of words) {
    if (w.kanji) texts.set(w.kanji, "word");
    if (w.example) texts.set(w.example, "example");
  }

  console.log(`词条 ${words.length}，待合成 ${texts.size} 条`);

  const accents = {};
  let made = 0;
  let reused = 0;

  for (const [text] of texts) {
    const id = idOf(text);
    const out = path.join(AUDIO_DIR, `${id}.m4a`);

    const query = await audioQuery(text);
    accents[text] = slimAccents(query);

    if (existsSync(out)) {
      reused++;
      continue;
    }
    await toM4a(await synthesize(query), out);
    made++;
    if (made % 20 === 0) console.log(`  …已生成 ${made}`);
  }

  // 清掉词条删改后留下的孤儿文件
  const keep = new Set([...texts.keys()].map((t) => `${idOf(t)}.m4a`));
  let removed = 0;
  for (const f of await readdir(AUDIO_DIR)) {
    if (f.endsWith(".m4a") && !keep.has(f)) {
      await rm(path.join(AUDIO_DIR, f));
      removed++;
    }
  }

  await writeFile(ACCENT_FILE, `${JSON.stringify(accents, null, 1)}\n`);

  console.log(`\n新生成 ${made}，复用 ${reused}，清理 ${removed}`);
  console.log(`音频 → public/audio/  音高 → src/data/accents.json`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
