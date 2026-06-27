import { getRedis, learnerKey } from "@/lib/redis";
import type { Learner } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uuid = searchParams.get("uuid");
  if (!uuid) {
    return Response.json({ error: "missing uuid" }, { status: 400 });
  }

  const redis = getRedis();
  const learner = await redis.get<Learner>(learnerKey(uuid));
  if (!learner) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(learner);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { uuid, learner, patch } = body as {
    uuid: string;
    learner?: Learner;
    patch?: Partial<Learner>;
  };

  if (!uuid) {
    return Response.json({ error: "missing uuid" }, { status: 400 });
  }

  const redis = getRedis();

  if (learner) {
    await redis.set(learnerKey(uuid), learner);
    return Response.json(learner);
  }

  const existing = await redis.get<Learner>(learnerKey(uuid));
  if (!existing) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const merged: Learner = {
    ...existing,
    ...patch,
    concepts: { ...existing.concepts, ...(patch?.concepts ?? {}) },
  };

  await redis.set(learnerKey(uuid), merged);
  return Response.json(merged);
}
