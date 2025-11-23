const mongoose = require("mongoose");

const rideRequestSchema = new mongoose.Schema({
  riderId: { type: String, required: true },
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  status: {
    type: String,
    enum: [
      "requested",
      "assigned",
      "accepted",
      "ongoing",
      "completed",
      "rider_cancelled",
      "driver_cancelled"
    ],
    default: "requested"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RideRequest", rideRequestSchema);
