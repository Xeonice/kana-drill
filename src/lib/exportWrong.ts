import type { Progress, Word } from "../types";

/** 错题帐导出成 Markdown 表格，方便贴回 Notion 或笔记里。 */
export function wrongListToMarkdown(rows: Word[], progress: Progress): string {
  const header = ["| 仮名 | 漢字 | 釈義 | 誤答 | 例文 |", "| --- | --- | --- | ---: | --- |"];
  const body = rows.map((w) => {
    const kanji = w.kanji === w.kana ? "—" : w.kanji;
    const times = progress.wrong[w.id] ?? 0;
    return `| ${w.kana} | ${kanji} | ${w.gloss} | ${times} | ${w.example} |`;
  });
  return [...header, ...body].join("\n");
}

/** 复制到剪贴板；旧浏览器或非安全上下文下退回 execCommand。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 落到下面的兜底方案
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
