// services/ride/rabbitmq.js
const amqp = require("amqplib");

let channel = null;
const RIDE_REQUEST_QUEUE = "ride_requests";
const DRIVER_ASSIGNMENT_QUEUE = "driver_assignments";
const RIDE_CANCELLED_QUEUE = "ride_cancelled";

async function connectRabbit() {
  const amqpUrl = process.env.RABBITMQ_URL || process.env.RIDE_SERVICE_RABBIT_URL || "amqp://rabbitmq";
  const maxRetries = 12;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const connection = await amqp.connect(amqpUrl);
      channel = await connection.createChannel();

      await channel.assertQueue(RIDE_REQUEST_QUEUE, { durable: true });
      await channel.assertQueue(DRIVER_ASSIGNMENT_QUEUE, { durable: true });
      await channel.assertQueue(RIDE_CANCELLED_QUEUE, { durable: true });

      console.log("Ride Service connected to RabbitMQ");
      return;
    } catch (err) {
      attempt++;
      console.error(`RabbitMQ connection error (attempt ${attempt}):`, err.message || err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.error("Could not connect to RabbitMQ after retries");
  process.exit(1);
}

function publishRideRequest(data) {
  if (!channel) {
    console.error("❌ publishRideRequest: channel not ready");
    return false;
  }
  channel.sendToQueue(RIDE_REQUEST_QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log("📤 Published Ride Request:", data);
  return true;
}

function publishDriverAssignment(data) {
  if (!channel) {
    console.error("❌ publishDriverAssignment: channel not ready");
    return false;
  }
  channel.sendToQueue(DRIVER_ASSIGNMENT_QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log("📤 Published Driver Assignment:", data);
  return true;
}

function publishRideCancelled(data) {
  if (!channel) {
    console.error("❌ publishRideCancelled: channel not ready");
    return false;
  }
  channel.sendToQueue(RIDE_CANCELLED_QUEUE, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log("📤 Published Ride Cancelled:", data);
  return true;
}

async function startRideRequestConsumer(handler) {
  if (!channel) return console.error("❌ startRideRequestConsumer: channel not ready");

  await channel.consume(
    RIDE_REQUEST_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Received Ride Request:", data);
        await handler(data);
        channel.ack(msg);
      } catch (err) {
        console.error("❌ ride request processing error:", err);
        channel.nack(msg, false, true); // requeue
      }
    },
    { noAck: false }
  );
}

module.exports = {
  connectRabbit,
  publishRideRequest,
  publishDriverAssignment,
  publishRideCancelled,
  startRideRequestConsumer,
};
