const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const mealRoutes = require("./routes/mealRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/mess");

// Initialize background jobs
require("./cron")();

app.use("/api/auth", authRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/admin", adminRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
