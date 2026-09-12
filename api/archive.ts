import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

/**
 * 学习档案的云端副本。整站开了 Vercel Authentication，
 * 能走到这里的请求都已经过身份校验，所以只存一份档案，不分用户。
 */
const REDIS_KEY = "kana-drill:archive";

function client(): Redis | null {
  // 集成注入的变量名两种都见过，都认
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
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
      const archive = body?.archive;
      if (!archive || typeof archive !== "object" || typeof archive.stats !== "object") {
        return res.status(400).json({ error: "invalid_archive" });
      }
      await redis.set(REDIS_KEY, archive);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    return res.status(500).json({ error: "storage_failed", message });
  }
}
