require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { connectRedis } = require("./redisClient");

const {
  connectRabbit,
  startDriverAssignmentConsumer,
  startRideCancelledConsumer
} = require("./rabbitmq");

const driverRoutes = require("./routes/driver");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/ridehailing";

app.use("/driver", driverRoutes);

app.get("/", (req, res) => res.send("Driver Service running"));

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Driver Service connected to MongoDB");

    await connectRedis();
    console.log("Driver Service connected to Redis");

    await connectRabbit();
    console.log("Driver Service connected to RabbitMQ");

    // START CONSUMERS (Fix: No callback needed for assignment queue)
    await startDriverAssignmentConsumer();

    // Ride cancelled consumer
    await startRideCancelledConsumer(async (data) => {
      console.log("🚫 Handling cancelled ride for driver:", data.driverId);

      const redis = require("./redisClient").getRedisClient();
      await redis.del(`assigned:${data.driverId}`);

      console.log("✔ Driver assignment cleared from Redis");
    });

    console.log("All RabbitMQ consumers started");

    app.listen(PORT, () =>
      console.log(`Driver Service running on port ${PORT}`)
    );
  } catch (err) {
    console.error("Driver Service startup error:", err);
    process.exit(1);
  }
}

start();
