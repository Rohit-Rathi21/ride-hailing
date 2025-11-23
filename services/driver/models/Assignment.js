const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  rideId: { type: String, required: true },
  riderId: { type: String, required: true },
  driverId: { type: String, required: true },
  pickup: { type: String },
  dropoff: { type: String },
  status: {
    type: String,
    enum: ["assigned", "accepted", "driver_cancelled", "ongoing", "completed"],
    default: "assigned"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Assignment", assignmentSchema);
