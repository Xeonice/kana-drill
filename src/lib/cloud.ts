import type { Archive } from "../types";
import { isArchive } from "./archive";

/** 云端同步的状态，用于在界面上说清楚进度到底存到哪了。 */
export type SyncState = "offline" | "syncing" | "synced" | "failed";

/**
 * 拉取云端档案。没配数据库（503）或网络不通时返回 null，
 * 调用方照常用本机档案，不把人挡在外面。
 */
export async function fetchArchive(): Promise<Archive | null> {
  try {
    const res = await fetch("/api/archive", { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const body = (await res.json()) as { archive?: unknown };
    return isArchive(body.archive) ? body.archive : null;
  } catch {
    return null;
  }
}

/** 推送档案。返回是否真的存上了，让界面能如实显示。 */
export async function pushArchive(archive: Archive): Promise<boolean> {
  try {
    const res = await fetch("/api/archive", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ archive }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
