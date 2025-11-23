require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const riderRoutes = require("./routes/rider");
const { connectQueue } = require("./rabbitmq");

const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));

app.use("/rider", riderRoutes);

app.get("/", (req, res) => res.send("Rider Service running"));

const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI;

// Start service
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Rider Service connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`Rider Service running on port ${PORT}`)
    );
    connectQueue();
  })
  .catch((err) => console.error("MongoDB error:", err));
