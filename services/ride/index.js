// services/ride/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");

const redisClient = require("./redisClient"); // ensure this exports functions you use
const Ride = require("./models/Ride");
const rideRoutes = require("./routes/ride");

const {
  connectRabbit,
  publishRideRequest,
  publishDriverAssignment,
  startRideRequestConsumer,
  publishRideCancelled,
} = require("./rabbitmq");

const app = express();
app.use(bodyParser.json());
app.use(morgan("dev"));

// expose publishRideRequest to routes (so router can call req.publishRideRequest or global)
app.use((req, res, next) => {
  req.publishRideRequest = publishRideRequest;
  next();
});

app.use("/ride", rideRoutes);
app.get("/", (req, res) => res.send("Ride Service running"));

const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/ridehailing";

/**
 * Pick a driver from Redis (random for MVP)
 */
async function pickDriver() {
  // redisClient here should export a client object with srandmember
  return redisClient.srandmember("online_drivers");
}

/**
 * Handler invoked when a ride request message is consumed
 */
async function handleIncomingRide(data) {
  try {
    const { riderId, pickup, dropoff } = data;

    const ride = await Ride.create({
      riderId,
      pickup,
      dropoff,
      status: "requested",
    });

    // pick driver
    const driverId = await pickDriver();

    if (!driverId) {
      console.log("No drivers available for ride:", ride._id);
      // Optionally publish to a retry queue or update DB — keep requested
      return;
    }

    // assign and save
    ride.driverId = driverId;
    ride.status = "assigned";
    ride.assignedAt = new Date();
    await ride.save();

    // publish assignment to drivers
    publishDriverAssignment({
      assignmentId: ride._id.toString(),
      rideId: ride._id.toString(),
      riderId,
      driverId,
      pickup,
      dropoff,
    });

    console.log(`Ride ${ride._id} assigned to driver ${driverId}`);
  } catch (err) {
    console.error("handleIncomingRide error:", err);
    throw err;
  }
}

/**
 * Start up: connect to DB, RabbitMQ, start consumer and server
 */
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Ride Service connected to MongoDB");

    // Connect Redis client (your redisClient module should handle connection)
    // ioredis auto-connects, so DO NOT call connect()
try {
    if (redisClient.status !== "ready" && redisClient.status !== "connecting") {
      await redisClient.connect();
    }
  } catch (err) {
    console.log("Redis already connected, continuing...");
  }

  console.log("Ride Service connected to Redis");


    // Connect to RabbitMQ and then wire up publish function
    await connectRabbit();
    // make publish function globally available (router may use global or req.publishRideRequest)
    global.publishRideRequest = publishRideRequest;

    // start consuming ride_requests
    await startRideRequestConsumer(handleIncomingRide);

    app.listen(PORT, () => console.log(`Ride Service running on port ${PORT}`));
  } catch (err) {
    console.error("Ride Service startup error:", err);
    process.exit(1);
  }
}

start();
