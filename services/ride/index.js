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

// Expose the publish function to routes if needed (same pattern we used)
app.use((req, res, next) => {
  req.publishRideRequest = publishRideRequest;
  next();
});

app.use("/ride", rideRoutes);
app.get("/", (req, res) => res.send("Ride Service running"));

const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/ridehailing";

// pick a driver from redis set
async function pickDriver() {
  try {
    return await redis.srandmember("online_drivers");
  } catch (err) {
    console.error("pickDriver error:", err);
    return null;
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

    const driverId = await pickDriver();
    if (!driverId) {
      console.log("No drivers available for ride:", ride._id.toString());
      return;
    }

    ride.driverId = driverId;
    ride.status = "assigned";
    ride.assignedAt = new Date();
    await ride.save();

    publishDriverAssignment({
      assignmentId: ride._id.toString(),
      rideId: ride._id.toString(),
      riderId,
      driverId,
      pickup,
      dropoff,
    });

    console.log(`Ride ${ride._id.toString()} assigned to driver ${driverId}`);
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
