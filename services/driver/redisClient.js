const Redis = require("ioredis");

let redis;

async function connectRedis() {
  const url = process.env.REDIS_URL || "redis://redis:6379";
  redis = new Redis(url);
  // optional: test
  await redis.ping();
  return redis;
}

function getRedisClient() {
  if (!redis) throw new Error("Redis not connected");
  return redis;
}

module.exports = { connectRedis, getRedisClient };
