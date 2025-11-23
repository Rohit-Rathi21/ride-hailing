// services/driver/routes/driver.js
const express = require("express");
const axios = require("axios");
const { getRedisClient } = require("../redisClient");

const router = express.Router();

// helper to get ride service url with fallback
const getRideServiceUrl = () => process.env.RIDE_SERVICE_URL || "http://ride-service:3004";

/** POST /driver/online { driverId } */
router.post("/online", async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ message: "Missing driverId" });
    const redis = getRedisClient();
    await redis.sadd("online_drivers", driverId);
    console.log("Driver marked online:", driverId);
    res.json({ message: "Driver marked online" });
  } catch (err) {
    console.error("Online error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/** POST /driver/offline { driverId } */
router.post("/offline", async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ message: "Missing driverId" });
    const redis = getRedisClient();
    await redis.srem("online_drivers", driverId);
    await redis.del(`assigned:${driverId}`);
    console.log("Driver marked offline:", driverId);
    res.json({ message: "Driver marked offline" });
  } catch (err) {
    console.error("Offline error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/** GET /driver/assigned/:driverId */
router.get("/assigned/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const redis = getRedisClient();
    const key = `assigned:${driverId}`;
    const raw = await redis.get(key);
    if (!raw) return res.json({ ride: null });
    const ride = JSON.parse(raw);

    const fixedRide = {
      _id: ride.rideId,
      rideId: ride.rideId,
      riderId: ride.riderId,
      driverId: ride.driverId,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      createdAt: ride.createdAt || null,
      status: ride.status || "assigned"
    };

    return res.json({ ride: fixedRide });
  } catch (err) {
    console.error("Assigned error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /driver/accept { driverId, rideId }
 * Calls ride service to set status accepted
 */
router.post("/accept", async (req, res) => {
  try {
    const { driverId, rideId } = req.body;
    if (!driverId || !rideId) return res.status(400).json({ message: "Missing fields" });

    const rideServiceUrl = getRideServiceUrl();
    console.log("ACCEPT: calling rideService", { rideServiceUrl, driverId, rideId });

    // call ride-service status endpoint
    await axios.post(`${rideServiceUrl}/ride/${rideId}/status`, { status: "accepted" });

    // clear assignment
    const redis = getRedisClient();
    await redis.del(`assigned:${driverId}`);

    console.log("Ride accepted:", rideId, "by driver:", driverId);
    res.json({ message: "Ride accepted" });
  } catch (err) {
    console.error("Error accepting ride:", err.response?.data || err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /driver/start { driverId, rideId }
 * Calls ride service to set status ongoing
 */
router.post("/start", async (req, res) => {
  try {
    const { driverId, rideId } = req.body;
    if (!driverId || !rideId) return res.status(400).json({ message: "Missing fields" });

    const rideServiceUrl = getRideServiceUrl();
    console.log("START: calling rideService", { rideServiceUrl, driverId, rideId });

    await axios.post(`${rideServiceUrl}/ride/${rideId}/status`, { status: "ongoing" });

    const redis = getRedisClient();
    await redis.del(`assigned:${driverId}`);

    console.log("Ride started:", rideId, "by driver:", driverId);
    res.json({ message: "Ride started" });
  } catch (err) {
    console.error("Start error:", err.response?.data || err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /driver/complete { driverId, rideId }
 * Calls ride service to complete the ride
 */
router.post("/complete", async (req, res) => {
  try {
    const { driverId, rideId } = req.body;
    if (!driverId || !rideId) return res.status(400).json({ message: "Missing fields" });

    const rideServiceUrl = getRideServiceUrl();
    console.log("COMPLETE: calling rideService", { rideServiceUrl, driverId, rideId });

    await axios.post(`${rideServiceUrl}/ride/complete`, { rideId });

    const redis = getRedisClient();
    await redis.del(`assigned:${driverId}`);

    console.log("Ride completed:", rideId, "by driver:", driverId);
    res.json({ message: "Ride completed" });
  } catch (err) {
    console.error("Complete error:", err.response?.data || err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

/** Decline (optional) */
router.post("/decline", async (req, res) => {
  try {
    const { driverId, rideId } = req.body;
    if (!driverId || !rideId) return res.status(400).json({ message: "Missing fields" });
    const redis = getRedisClient();
    await redis.del(`assigned:${driverId}`);
    console.log("Ride declined:", rideId, "by driver:", driverId);
    res.json({ message: "Declined" });
  } catch (err) {
    console.error("Decline error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
