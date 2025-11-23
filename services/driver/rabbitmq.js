const amqp = require("amqplib");

let channel = null;

const DRIVER_ASSIGNMENTS_QUEUE = "driver_assignments";
const RIDE_CANCELLED_QUEUE = "ride_cancelled";

async function connectRabbit() {
  try {
    const amqpUrl = process.env.RABBIT_URL || "amqp://rabbitmq:5672";
    const connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();

    await channel.assertQueue(DRIVER_ASSIGNMENTS_QUEUE, { durable: true });
    await channel.assertQueue(RIDE_CANCELLED_QUEUE, { durable: true });

    console.log("Driver Service connected to RabbitMQ");
  } catch (err) {
    console.error("RabbitMQ Connection Error:", err);
  }
}

/**
 * DRIVER ASSIGNMENT CONSUMER
 */
async function startDriverAssignmentConsumer() {
  if (!channel) return console.error("RabbitMQ channel not initialized!");

  await channel.consume(
    DRIVER_ASSIGNMENTS_QUEUE,
    async (msg) => {
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Received driver assignment:", data);

        const redis = require("./redisClient").getRedisClient();
        const key = `assigned:${data.driverId}`;

        await redis.set(key, JSON.stringify(data));

        console.log("✔ Stored assignment in Redis:", data.driverId);

        channel.ack(msg);
      } catch (err) {
        console.error("Assignment Consumer Error:", err);
        channel.nack(msg);
      }
    },
    { noAck: false }
  );
}

/**
 * RIDE CANCELLED CONSUMER
 */
async function startRideCancelledConsumer(callback) {
  if (!channel) return console.error("RabbitMQ channel not ready!");

  await channel.consume(
    RIDE_CANCELLED_QUEUE,
    async (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log("📥 Driver got ride_cancelled:", data);

      await callback(data);

      channel.ack(msg);
    },
    { noAck: false }
  );
}

module.exports = {
  connectRabbit,
  startDriverAssignmentConsumer,
  startRideCancelledConsumer
};
