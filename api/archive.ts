import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

/**
 * 学习档案的云端副本。整站开了 Vercel Authentication，
 * 能走到这里的请求都已经过身份校验，所以只存一份档案，不分用户。
 */
const REDIS_KEY = "kana-drill:archive";

type WordStat = {
  box: number;
  wrong: number;
  right: number;
  lastSeen: string;
  dueOn: string;
  updatedAt?: string;
};

type Archive = {
  version: number;
  stats: Record<string, WordStat>;
  updatedAt: string;
};

function client(): Redis | null {
  // 集成注入的变量名两种都见过，都认
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function isArchive(value: unknown): value is Archive {
  if (typeof value !== "object" || value === null) return false;
  const a = value as Partial<Archive>;
  return typeof a.stats === "object" && a.stats !== null;
}

/**
 * 逐条合并，同一条成绩取判定时刻更新的那个。
 * 整份覆盖的话，手机先推、电脑后推就会把手机那半天的进度抹掉。
 */
function merge(base: Archive, incoming: Archive): Archive {
  const stats: Record<string, WordStat> = { ...base.stats };
  for (const [key, next] of Object.entries(incoming.stats)) {
    const current = stats[key];
    if (!current || (next.updatedAt ?? "") > (current.updatedAt ?? "")) {
      stats[key] = next;
    }
  }
  return {
    version: incoming.version,
    stats,
    updatedAt:
      base.updatedAt > incoming.updatedAt ? base.updatedAt : incoming.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const redis = client();
  if (!redis) {
    // 没配数据库时老实说，前端会退回只用本机存储
    return res.status(503).json({ error: "storage_not_configured" });
  }

  try {
    if (req.method === "GET") {
      const archive = await redis.get(REDIS_KEY);
      return res.status(200).json({ archive: archive ?? null });
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const incoming = body?.archive;
      if (!isArchive(incoming)) {
        return res.status(400).json({ error: "invalid_archive" });
      }

      const existing = await redis.get(REDIS_KEY);
      const merged = isArchive(existing) ? merge(existing, incoming) : incoming;
      await redis.set(REDIS_KEY, merged);

      // 把合并结果给回去，客户端据此跟上别的设备写入的记录
      return res.status(200).json({ ok: true, archive: merged });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return res.status(500).json({ error: "storage_failed", message });
  }
}
