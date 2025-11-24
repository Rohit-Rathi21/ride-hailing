const express = require("express");
const Ride = require("../models/Ride");
const router = express.Router();

/**
 * Rider requests a ride
 * POST /ride/request
 * (RabbitMQ creates the ride document, NOT this endpoint)
 */
router.post("/request", async (req, res) => {
  try {
    const { riderId, pickup, destination } = req.body;

    if (!riderId || !pickup || !destination)
      return res.status(400).json({ message: "Missing fields" });

    // Publish to RabbitMQ using global function from index.js
    req.publishRideRequest({
      riderId,
      pickup,
      dropoff: destination,
    });

    res.json({ message: "Ride request sent" });
  } catch (err) {
    console.error("REQUEST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /ride/:id
 * Rider polls for status updates
 */
router.get("/:id", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json(ride);
  } catch (err) {
    console.error("GET RIDE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Update status
 * POST /ride/:id/status
 */
router.post("/:id/status", async (req, res) => {
  try {
    console.log("STATUS UPDATE HIT:", req.params.id, req.body);

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const { status } = req.body;
    ride.status = status;

    if (status === "accepted") ride.assignedAt = new Date();
    if (status === "ongoing") ride.startedAt = new Date();
    if (status === "completed") ride.completedAt = new Date();

    await ride.save();
    res.json({ message: "Ride status updated", ride });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Cancel ride
 */
router.post("/cancel", async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "rider_cancelled";
    ride.cancelledAt = new Date();
    await ride.save();

    // publish cancel event to driver-service
    publishRideCancelled({
      rideId,
      driverId: ride.driverId,
      riderId: ride.riderId
    });

    res.json({ message: "Ride cancelled", ride });
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/**
 * COMPLETE Ride
 */
router.post("/complete", async (req, res) => {
  try {
    const { rideId } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    ride.status = "completed";
    ride.completedAt = new Date();
    await ride.save();

    res.json({ message: "Ride completed", ride });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Rider history
 */
router.get("/history/rider/:riderId", async (req, res) => {
  try {
    const rides = await Ride.find({ riderId: req.params.riderId }).sort({
      createdAt: -1,
    });
    res.json(rides);
  } catch (err) {
    console.error("RIDER HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Driver history
 */
router.get("/history/driver/:driverId", async (req, res) => {
  try {
    const rides = await Ride.find({ driverId: req.params.driverId }).sort({
      createdAt: -1,
    });
    res.json(rides);
  } catch (err) {
    console.error("DRIVER HISTORY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
