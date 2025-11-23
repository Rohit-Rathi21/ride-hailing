// services/ride/rabbitmq.js
const amqp = require("amqplib");

let channel = null;
let connection = null;

// Queue names (single source of truth)
const RIDE_REQUEST_QUEUE = "ride_requests";
const DRIVER_ASSIGNMENT_QUEUE = "driver_assignments";
const RIDE_CANCELLED_QUEUE = "ride_cancelled";

/**
 * Connect to RabbitMQ and initialise channel + queues
 * Returns when channel is ready.
 */
async function connectRabbit() {
  try {
    const amqpUrl =
      process.env.RABBIT_URL ||
      process.env.RABBITMQ_URL ||
      "amqp://rabbitmq:5672";

    connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();

    await channel.assertQueue(RIDE_REQUEST_QUEUE, { durable: true });
    await channel.assertQueue(DRIVER_ASSIGNMENT_QUEUE, { durable: true });
    await channel.assertQueue(RIDE_CANCELLED_QUEUE, { durable: true });

    console.log("Ride Service connected to RabbitMQ");
    return true;
  } catch (err) {
    console.error("RabbitMQ connection error:", err);
    throw err;
  }
}

/**
 * Publish a ride request (rider -> ride_requests)
 */
function publishRideRequest(data) {
  if (!channel) {
    console.error("❌ Cannot publish ride request — channel not ready");
    return false;
  }
  channel.sendToQueue(
    RIDE_REQUEST_QUEUE,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
  console.log("📤 Published Ride Request:", data);
  return true;
}

/**
 * Publish driver assignment (ride-service -> driver_assignments)
 */
function publishDriverAssignment(data) {
  if (!channel) {
    console.error("❌ Cannot publish assignment — channel not ready");
    return false;
  }
  channel.sendToQueue(
    DRIVER_ASSIGNMENT_QUEUE,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
  console.log("📤 Published Driver Assignment:", data);
  return true;
}

/**
 * Publish ride cancelled (rider -> ride_cancelled)
 */
function publishRideCancelled(data) {
  if (!channel) {
    console.error("❌ Cannot publish ride cancelled — channel not ready");
    return false;
  }
  channel.sendToQueue(
    RIDE_CANCELLED_QUEUE,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
  console.log("📤 Published Ride Cancelled:", data);
  return true;
}

/**
 * Start consumer for ride_requests
 * handlerCallback: async function(data) => { ... }
 */
async function startRideRequestConsumer(handlerCallback) {
  if (!channel) {
    throw new Error("RabbitMQ channel not ready");
  }

  await channel.consume(
    RIDE_REQUEST_QUEUE,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        console.log("📥 Received Ride Request:", data);
        await handlerCallback(data);
        channel.ack(msg);
      } catch (err) {
        console.error("❌ Ride request processing error:", err);
        // requeue for retry
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}

/**
 * Optionally allow other services to consume driver_assignments or ride_cancelled queues
 * (exported here if needed)
 */
async function startGenericConsumer(queueName, handlerCallback) {
  if (!channel) throw new Error("RabbitMQ channel not ready");
  await channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handlerCallback(data);
        channel.ack(msg);
      } catch (err) {
        console.error(`Consumer error for ${queueName}:`, err);
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );
}

module.exports = {
  connectRabbit,
  publishRideRequest,
  publishRideCancelled,
  publishDriverAssignment,
  startRideRequestConsumer,
  startGenericConsumer,
};
