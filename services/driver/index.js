// services/driver/index.js
require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const driverRoutes = require("./routes/driver");
const { connectRedis } = require("./redisClient");
const { connectRabbit, startDriverAssignmentConsumer, startRideCancelledConsumer } = require("./rabbitmq");

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

    await connectRabbit(); // set up channel
    // start consumers to handle assignments and cancellations
    await startDriverAssignmentConsumer();
    await startRideCancelledConsumer(handleRideCancelled);

    app.listen(PORT, () => console.log(`Driver Service running on port ${PORT}`));
  } catch (err) {
    console.error("Driver Service startup error:", err);
    process.exit(1);
  }
}

async function handleRideCancelled(data) {
  // data should contain { rideId, driverId, ... }
  try {
    const redisClient = require("./redisClient").getRedisClient();
    if (data?.driverId) {
      await redisClient.del(`assigned:${data.driverId}`);
      console.log("Cleared assignment for driver due to cancellation:", data.driverId);
    }
  } catch (err) {
    console.error("handleRideCancelled error:", err);
  }
}

start();
