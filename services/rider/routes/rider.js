const express = require("express");
const RideRequest = require("../models/RideRequest");
const { publishRideRequest } = require("../rabbitmq");

const router = express.Router();

/**
 * Request a ride
 * POST /rider/request
 * body: { riderId, pickup, dropoff }
 */
router.post("/request", async (req, res) => {
  try {
    const { riderId, pickup, dropoff } = req.body;
    if (!riderId || !pickup || !dropoff)
      return res.status(400).json({ message: "Missing fields" });

    const ride = await RideRequest.create({ riderId, pickup, dropoff });

    // Publish ride request to RabbitMQ
    publishRideRequest({
      rideId: ride._id,
      riderId,
      pickup,
      dropoff
    });

    res.json({ message: "Ride requested", ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Cancel ride
 * POST /rider/cancel
 * body: { rideId }
 */
router.post("/cancel", async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ message: "Missing rideId" });

    const ride = await RideRequest.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "rider_cancelled";
    await ride.save();

    res.json({ message: "Ride cancelled", ride });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Rider history
 * GET /rider/history/:riderId
 */
router.get("/history/:riderId", async (req, res) => {
  try {
    const rides = await RideRequest.find({ riderId: req.params.riderId })
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
