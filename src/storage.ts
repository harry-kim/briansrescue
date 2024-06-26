// src/storage.ts
import { kv } from "@vercel/kv";

export interface Storage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  hget(key: string, field: string): Promise<any>;
  hset(key: string, value: any): Promise<number>;
  del(key: string): Promise<number>;
}
export class VercelKV implements Storage {
  async get(key: string): Promise<any> {
    return await kv.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    return await kv.set(key, value);
  }

  async hget(key: string, field: any): Promise<any> {
    return await kv.hget(key, field);
  }
  async hset(key: string, value: any): Promise<number> {
    return await kv.hset(key, value);
  }

  async del(key: string): Promise<number> {
    return await kv.del(key);
  }
}

export class MockVercelKV implements Storage {
  private store: Map<string, any>;
  private hashStore: Map<string, Map<string, any>>;

  constructor() {
    this.store = new Map<string, any>();
    this.hashStore = new Map<string, Map<string, any>>();
  }

  async get(key: string): Promise<any> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
  }

  async hget(key: string, field: string): Promise<any> {
    return this.hashStore.get(key)?.get(field) ?? null;
  }

  async hset(key: string, values: { [key: string]: any }): Promise<number> {
    let hash = this.hashStore.get(key);
    if (!hash) {
      hash = new Map<string, any>();
      this.hashStore.set(key, hash);
    }
    let count = 0;
    Object.keys(values).forEach((field) => {
      if (!hash!.has(field) || hash!.get(field) !== values[field]) {
        count++;
      }
      hash!.set(field, values[field]);
    });
    return count;
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return Number(deleted);
  }
}

// Storage factory

const storage: Storage = !process.env.MOCK_KV
  ? new VercelKV()
  : new MockVercelKV();
export default storage;
