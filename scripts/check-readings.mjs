/**
 * 校验笔记里的假名与 VOICEVOX 的读音是否一致。
 *
 * 不一致有两种可能：笔记抄错了，或者 VOICEVOX 的词典判断有误。
 * 无论哪种都值得看一眼 —— 前者会让假名模式教错读音，后者会让听力模式念错。
 *
 * 比对前先把两边归一化成音素形式：片假名转平假名、长音符展开、
 * おう/えい 这类长音写法折成 おお/ええ，否则会得到一堆误报。
 *
 * 用法：npm run check:readings（跑 npm run voices 之后）
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const KATA = "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンーヴ";
const HIRA = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをんーゔ";

const toHira = (s) =>
  [...s].map((c) => {
    const i = KATA.indexOf(c);
    return i < 0 ? c : HIRA[i];
  }).join("");

/** 每个假名的元音，用于展开长音符 */
const VOWEL = {
  あ: "あ", い: "い", う: "う", え: "え", お: "お",
  か: "あ", き: "い", く: "う", け: "え", こ: "お",
  さ: "あ", し: "い", す: "う", せ: "え", そ: "お",
  た: "あ", ち: "い", つ: "う", て: "え", と: "お",
  な: "あ", に: "い", ぬ: "う", ね: "え", の: "お",
  は: "あ", ひ: "い", ふ: "う", へ: "え", ほ: "お",
  ま: "あ", み: "い", む: "う", め: "え", も: "お",
  や: "あ", ゆ: "う", よ: "お",
  ら: "あ", り: "い", る: "う", れ: "え", ろ: "お",
  わ: "あ", が: "あ", ぎ: "い", ぐ: "う", げ: "え", ご: "お",
  ざ: "あ", じ: "い", ず: "う", ぜ: "え", ぞ: "お",
  だ: "あ", ぢ: "い", づ: "う", で: "え", ど: "お",
  ば: "あ", び: "い", ぶ: "う", べ: "え", ぼ: "お",
  ぱ: "あ", ぴ: "い", ぷ: "う", ぺ: "え", ぽ: "お",
  ゃ: "あ", ゅ: "う", ょ: "お", ゔ: "う",
};

function canon(text) {
  let s = toHira(text);
  // 长音符展开成前一个音的元音
  let out = "";
  for (const ch of s) {
    out += ch === "ー" && out ? VOWEL[out.at(-1)] ?? out.at(-1) : ch;
  }
  // おう → おお、えい → ええ：与 VOICEVOX 的音素记法对齐
  return out
    .replace(/([こそとのほもよろごぞどぼぽょお])う/g, "$1お")
    .replace(/([けせてねへめれげぜでべぺぇえ])い/g, "$1え");
}

const accents = JSON.parse(
  await readFile(path.join(ROOT, "src", "data", "accents.json"), "utf8"),
);

function reading(text) {
  const phrases = accents[text];
  if (!phrases) return null;
  return phrases.flatMap((p) => p.moras.map((m) => m.text)).join("");
}

const dir = path.join(ROOT, "src", "data", "decks");
const files = (await readdir(dir)).filter((f) => f.endsWith(".ts")).sort();

let checked = 0;
const problems = [];

for (const file of files) {
  const src = await readFile(path.join(dir, file), "utf8");
  const rows = src.match(/^\s*\["[\s\S]*?\],$/gm) ?? [];
  for (const row of rows) {
    const cells = [...row.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    if (cells.length < 2) continue;
    const [kana, kanji] = cells;
    const said = reading(kanji);
    if (!said) continue;
    checked++;
    if (canon(said) !== canon(kana)) {
      problems.push({ deck: file.replace(/\.ts$/, ""), kanji, kana, said: toHira(said) });
    }
  }
}

if (problems.length === 0) {
  console.log(`读音一致：${checked} 词全部通过`);
} else {
  console.log(`读音不一致 ${problems.length} 处（共 ${checked} 词）：\n`);
  for (const p of problems) {
    console.log(`  [${p.deck}] ${p.kanji}　笔记: ${p.kana}　VOICEVOX: ${p.said}`);
  }
  console.log("\n笔记抄错就改词库，VOICEVOX 判断有误则忽略这条。");
}
