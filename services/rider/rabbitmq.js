const amqp = require("amqplib");

let channel;
let connection;

async function connectQueue() {
  let retries = 10;

  while (retries) {
    try {
      connection = await amqp.connect(process.env.RABBIT_URL);
      channel = await connection.createChannel();

      await channel.assertQueue("ride_requests");

      console.log("Rider Service connected to RabbitMQ");
      return channel;

    } catch (err) {
      console.error("RabbitMQ connection failed:", err.message);
      retries -= 1;
      console.log(`Retrying in 5 seconds... (${retries} retries left)`);

      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  console.error("Could not connect to RabbitMQ after multiple retries.");
  process.exit(1);
}

function publishRideRequest(data) {
  if (!channel) {
    console.error("Cannot publish — RabbitMQ channel not ready.");
    return;
  }
  channel.sendToQueue("ride_requests", Buffer.from(JSON.stringify(data)));
  console.log("Published ride request:", data);
}

module.exports = { connectQueue, publishRideRequest };
