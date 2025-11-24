// services/ride/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const redis = require("./redisClient"); // singleton instance
const {
  connectRabbit,
  startRideRequestConsumer,
  publishDriverAssignment,
  publishRideCancelled,
  publishRideRequest // optional export for direct publish usage inside routes
} = require("./rabbitmq");
const rideRoutes = require("./routes/ride");
const Ride = require("./models/Ride");

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));

// Expose the publish functions to routes if needed (same pattern we used)
app.use((req, res, next) => {
  req.publishRideRequest = publishRideRequest;
  req.publishRideCancelled = publishRideCancelled;
  next();
});

app.use("/ride", rideRoutes);
app.get("/", (req, res) => res.send("Ride Service running"));

const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/ridehailing";

// Get all online drivers from redis
async function getAllOnlineDrivers() {
  try {
    return await redis.smembers("online_drivers");
  } catch (err) {
    console.error("getAllOnlineDrivers error:", err);
    return [];
  }
}

async function handleIncomingRide(data) {
  // data { riderId, pickup, dropoff }
  try {
    const { riderId, pickup, dropoff } = data;
    const ride = await Ride.create({
      riderId,
      pickup,
      dropoff,
      status: "requested",
    });

    // Get all online drivers
    const onlineDrivers = await getAllOnlineDrivers();
    
    if (onlineDrivers.length === 0) {
      console.log("No drivers available for ride:", ride._id.toString());
      return;
    }

    // Store ride in Redis with requested status so all drivers can see it
    await redis.set(
      `ride:pending:${ride._id.toString()}`,
      JSON.stringify({
        rideId: ride._id.toString(),
        riderId,
        pickup,
        dropoff,
        status: "requested",
        createdAt: ride.createdAt
      }),
      'EX',
      3600
    ); // Expire after 1 hour

    // Broadcast to ALL online drivers (no auto-assignment)
    console.log(`✅ Ride ${ride._id.toString()} broadcast to ${onlineDrivers.length} online drivers`);
  } catch (err) {
    console.error("handleIncomingRide error:", err);
    throw err;
  }
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Ride Service connected to MongoDB");

    // connect rabbit and start consumer
    await connectRabbit(); // sets up channel internally
    await startRideRequestConsumer(handleIncomingRide);

    app.listen(PORT, () => console.log(`Ride Service running on port ${PORT}`));
  } catch (err) {
    console.error("Ride Service startup error:", err);
    process.exit(1);
  }
}

start();
