const kv = {
    get: jest.fn().mockResolvedValue("mocked value"),
    set: jest.fn().mockResolvedValue(undefined),
    hget: jest.fn().mockResolvedValue("mocked value"),
    hset: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
  };
  
  module.exports = { kv };