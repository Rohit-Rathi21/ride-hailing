// services/driver/rabbitmq.js
const amqp = require("amqplib");

let channel = null;
const DRIVER_ASSIGNMENTS_QUEUE = "driver_assignments";
const RIDE_CANCELLED_QUEUE = "ride_cancelled";

async function connectRabbit() {
  const amqpUrl = process.env.RABBITMQ_URL || process.env.DRIVER_SERVICE_RABBIT_URL || "amqp://rabbitmq:5672";
  const maxRetries = 12;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await amqp.connect(amqpUrl);
      channel = await conn.createChannel();

      await channel.assertQueue(DRIVER_ASSIGNMENTS_QUEUE, { durable: true });
      await channel.assertQueue(RIDE_CANCELLED_QUEUE, { durable: true });

      console.log("Driver Service connected to RabbitMQ");
      return;
    } catch (err) {
      attempt++;
      console.error(`Driver RabbitMQ connection error (attempt ${attempt}):`, err.message || err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.error("Driver Service unable to connect to RabbitMQ after retries");
  process.exit(1);
}

async function startDriverAssignmentConsumer() {
  if (!channel) return console.error("Driver RabbitMQ channel not initialized!");

  await channel.consume(
    DRIVER_ASSIGNMENTS_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Received driver assignment:", data);

        const redis = require("./redisClient").getRedisClient();
        const key = `assigned:${data.driverId}`;
        await redis.set(key, JSON.stringify(data));
        console.log("Stored assignment in redis for driver:", data.driverId);

        channel.ack(msg);
      } catch (err) {
        console.error("Assignment Consumer Error:", err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}

async function startRideCancelledConsumer(callback) {
  if (!channel) return console.error("Driver RabbitMQ channel not ready");

  await channel.consume(
    RIDE_CANCELLED_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Received ride_cancelled:", data);

        if (typeof callback === "function") {
          await callback(data);
        }

        channel.ack(msg);
      } catch (err) {
        console.error("ride_cancelled consumer error:", err);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

module.exports = {
  connectRabbit,
  startDriverAssignmentConsumer,
  startRideCancelledConsumer,
};
