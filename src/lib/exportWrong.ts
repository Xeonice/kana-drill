import type { Archive, Card } from "../types";
import { BOX_LABEL, MODES, MODE_SHORT, daysUntilDue, statKey } from "./archive";
import { usableInMode } from "./session";

/** 単語台帳导出成 Markdown 表格，方便贴回 Notion 或笔记里。 */
export function ledgerToMarkdown(rows: Card[], archive: Archive): string {
  const header = [
    `| 仮名 | 漢字 | 釈義 | ${MODES.map((m) => MODE_SHORT[m]).join(" | ")} | 次回 | 例文 |`,
    `| --- | --- | --- | ${MODES.map(() => "---").join(" | ")} | ---: | --- |`,
  ];

  const body = rows.map((c) => {
    const kanji = c.kanji === c.kana ? "—" : c.kanji;
    const cells = MODES.map((m) => {
      if (!usableInMode(c, m)) return "—";
      const stat = archive.stats[statKey(c.key, m)];
      return stat ? `${stat.box} ${BOX_LABEL[stat.box]}（誤 ${stat.wrong}）` : "未練習";
    });

    const days = MODES.map((m) => archive.stats[statKey(c.key, m)])
      .filter(Boolean)
      .map((s) => daysUntilDue(s!));
    const soonest = days.length > 0 ? Math.min(...days) : null;
    const due = soonest === null ? "—" : soonest <= 0 ? "今日" : `${soonest}日後`;

    return `| ${c.kana} | ${kanji} | ${c.gloss} | ${cells.join(" | ")} | ${due} | ${c.example} |`;
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
