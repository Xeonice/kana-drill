import type { Archive, Card } from "../types";
import { BOX_LABEL, daysUntilDue } from "./archive";

/** 単語台帳导出成 Markdown 表格，方便贴回 Notion 或笔记里。 */
export function ledgerToMarkdown(rows: Card[], archive: Archive): string {
  const header = [
    "| 仮名 | 漢字 | 釈義 | 熟練度 | 誤答 | 次回 | 例文 |",
    "| --- | --- | --- | --- | ---: | ---: | --- |",
  ];
  const body = rows.map((c) => {
    const stat = archive.stats[c.key];
    const kanji = c.kanji === c.kana ? "—" : c.kanji;
    if (!stat) return `| ${c.kana} | ${kanji} | ${c.gloss} | — | 0 | — | ${c.example} |`;
    const days = daysUntilDue(stat);
    const due = days <= 0 ? "今日" : `${days}日後`;
    return `| ${c.kana} | ${kanji} | ${c.gloss} | ${stat.box} ${BOX_LABEL[stat.box]} | ${stat.wrong} | ${due} | ${c.example} |`;
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
