const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  rideId: { type: String }, // optional duplicate of _id for convenience
  riderId: { type: String, required: true },
  driverId: { type: String, default: null },
  pickup: { type: String, required: true },
  dropoff: { type: String, required: true },
  status: {
    type: String,
    enum: [
      "requested",
      "assigned",
      "accepted",
      "driver_cancelled",
      "rider_cancelled",
      "ongoing",
      "completed"
    ],
    default: "requested"
  },
  assignedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ride", rideSchema);
