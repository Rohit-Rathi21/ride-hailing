const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379", 10)
});

redis.on("connect", () => console.log("Ride Service connected to Redis"));
redis.on("error", (err) => console.error("Ride Service Redis error:", err));

module.exports = redis;
