require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");

const app = express();

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/ridehailing";

app.use(morgan("dev"));
app.use(express.json()); // ✅ FIXED — no bodyParser

// routes
app.use("/auth", authRoutes);

// health
app.get("/", (req, res) => res.send("Auth Service running"));

// mongo connect
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Auth Service connected to MongoDB");
    app.listen(PORT, () => console.log(`Auth Service listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Mongo connection error", err);
    process.exit(1);
  });
