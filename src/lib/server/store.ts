import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { CallContent } from "../commitment";
import type { Outcome } from "../types";

// Call storage. Integrity does not depend on it: every call is anchored by its on-chain
// memo and can be re-verified from the chain. Uses Upstash Redis (Vercel Marketplace) when
// its env vars are present, and a local JSON file otherwise (offline dev / Surfpool tests).

export type CallRecord = CallContent & {
  id: string;
  commitHash: string;
  commitSig: string;
  committedAt: number; // block time of the memo transaction (unix seconds)
  revealAt: number;
  entryPrice: number | null; // filled once the first full minute after the commit has opened
  outcome: Outcome | null;
  unlocks: number;
  createdAt: number;
};

type Store = {
  list(): Promise<CallRecord[]>;
  get(id: string): Promise<CallRecord | null>;
  insert(record: CallRecord): Promise<CallRecord>;
  // Patches only derived fields (prices, outcome), which are deterministic, so a lost
  // concurrent write just recomputes the same value on the next read.
  update(id: string, patch: (r: CallRecord) => void): Promise<CallRecord | null>;
  incrementUnlocks(id: string): Promise<CallRecord | null>;
};

const DUPLICATE = "This commitment is already registered";

// The unlock count lives in its own counter key so increments are atomic.
function withoutUnlocks(record: CallRecord): Omit<CallRecord, "unlocks"> {
  const { unlocks, ...rest } = record;
  void unlocks;
  return rest;
}

function redisStore(redis: Redis): Store {
  const callKey = (id: string) => `poc:call:${id}`;
  const unlocksKey = (id: string) => `poc:unlocks:${id}`;

  async function get(id: string) {
    const [record, unlocks] = await Promise.all([
      redis.get<CallRecord>(callKey(id)),
      redis.get<number>(unlocksKey(id)),
    ]);
    return record ? { ...record, unlocks: unlocks ?? 0 } : null;
  }

  return {
    async list() {
      const ids = await redis.zrange<string[]>("poc:calls", 0, -1);
      const records = await Promise.all(ids.map(get));
      return records.filter((r): r is CallRecord => r !== null);
    },
    get,
    async insert(record) {
      // Claim the hash and the signature atomically so one commitment registers once.
      const claimed = await redis.set(`poc:hash:${record.commitHash}`, record.id, { nx: true });
      if (!claimed) throw new Error(DUPLICATE);
      if (!(await redis.set(`poc:sig:${record.commitSig}`, record.id, { nx: true }))) {
        await redis.del(`poc:hash:${record.commitHash}`);
        throw new Error(DUPLICATE);
      }
      await redis.set(callKey(record.id), withoutUnlocks(record));
      await redis.zadd("poc:calls", { score: record.committedAt, member: record.id });
      return record;
    },
    async update(id, patch) {
      const record = await get(id);
      if (!record) return null;
      patch(record);
      await redis.set(callKey(id), withoutUnlocks(record));
      return record;
    },
    async incrementUnlocks(id) {
      await redis.incr(unlocksKey(id));
      return get(id);
    },
  };
}

function fileStore(): Store {
  const FILE = path.join(process.cwd(), ".data", "calls.json");
  let queue: Promise<unknown> = Promise.resolve();

  async function readAll(): Promise<CallRecord[]> {
    try {
      return JSON.parse(await fs.readFile(FILE, "utf8")) as CallRecord[];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  async function writeAll(records: CallRecord[]) {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(records, null, 2));
    await fs.rename(tmp, FILE);
  }

  // Serialize read-modify-write cycles within this process.
  function mutate<T>(fn: (records: CallRecord[]) => T | Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const records = await readAll();
      const result = await fn(records);
      await writeAll(records);
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  const update = (id: string, patch: (r: CallRecord) => void) =>
    mutate((records) => {
      const r = records.find((x) => x.id === id);
      if (r) patch(r);
      return r ?? null;
    });

  return {
    list: readAll,
    get: async (id) => (await readAll()).find((r) => r.id === id) ?? null,
    insert: (record) =>
      mutate((records) => {
        if (records.some((r) => r.commitHash === record.commitHash || r.commitSig === record.commitSig)) {
          throw new Error(DUPLICATE);
        }
        records.push(record);
        return record;
      }),
    update,
    incrementUnlocks: (id) => update(id, (r) => void (r.unlocks += 1)),
  };
}

// Resolved lazily so `next build` never needs the database.
let store: Store | null = null;
function getStore(): Store {
  if (store) return store;
  const hasRedis =
    !!(process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
    !!(process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN);
  if (!hasRedis && process.env.VERCEL) {
    throw new Error("Upstash Redis env vars are missing; connect the Upstash store to this Vercel project");
  }
  store = hasRedis ? redisStore(Redis.fromEnv()) : fileStore();
  return store;
}

export const listCalls = () => getStore().list();
export const getCall = (id: string) => getStore().get(id);
export const insertCall = (record: CallRecord) => getStore().insert(record);
export const updateCall = (id: string, patch: (r: CallRecord) => void) => getStore().update(id, patch);
export const incrementUnlocks = (id: string) => getStore().incrementUnlocks(id);
