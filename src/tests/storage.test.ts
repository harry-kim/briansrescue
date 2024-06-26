jest.mock("@vercel/kv");

import { VercelKV, MockVercelKV } from "../storage";
import { kv } from "@vercel/kv";
describe("VercelKV", () => {
  let storageInstance: VercelKV;
  beforeAll(() => {
    storageInstance = new VercelKV();
  });

  it("get method should return correct value", async () => {
    const result = await storageInstance.get("key");

    expect(result).toBe("mocked value");
    expect(kv.get).toHaveBeenCalledWith("key");
  });

  it("set method should set correct value", async () => {
    const result = await storageInstance.set("key", "value");

    expect(result).toBe(undefined);
    expect(kv.set).toHaveBeenCalledWith("key", "value");
  });

  it("hget method should return correct value", async () => {
    const result = await storageInstance.hget("key", "field");
    expect(result).toBe("mocked value");
    expect(kv.hget).toHaveBeenCalledWith("key", "field");
  });

  it("hset method should set correct value", async () => {
    const result = await storageInstance.hset("key", "value");
    expect(result).toBe(1);
    expect(kv.hset).toHaveBeenCalledWith("key", "value");
  });

  it("del method should delete correct key", async () => {
    const result = await storageInstance.del("key");
    expect(result).toBe(1);
    expect(kv.del).toHaveBeenCalledWith("key");
  });
});

describe("MockVercelKV", () => {
  let storage: MockVercelKV;
  beforeAll(() => {
    storage = new MockVercelKV();
  });

  it("set method should set correct value", async () => {
    const result = await storage.set("key", "value");
    expect(result).toBe(undefined);
    const getResult = await storage.get("key");
    expect(getResult).toBe("value");
  });
  it("set method should set correctly overwrite value", async () => {
    await storage.set("key", "value");
    await storage.set("key", "value1");
    const getResult = await storage.get("key");
    expect(getResult).toBe("value1");
  });

  it("hset method should set correct value", async () => {
    const result = await storage.hset("key", { field: "hgetValue" });
    expect(result).toBe(1);
    const hgetResult = await storage.hget("key", "field");
    expect(hgetResult).toBe("hgetValue");
  });

  it("del method should delete correct key", async () => {
    await storage.set("delKey", "value");
    const getResult = await storage.get("delKey");
    expect(getResult).toBe("value");

    const result = await storage.del("delKey");
    expect(result).toBe(1);
    expect(await storage.get("delKey")).toBe(null);
  });
});
