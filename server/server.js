
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend server is running!",
  });
});

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const orgRoutes = require("./src/routes/orgRoutes");
const moduleRoutes = require("./src/routes/moduleRoutes");
const fieldRoutes = require("./src/routes/fieldRoutes");
const recordRoutes = require("./src/routes/recordRoutes");
const geminiRoutes = require("./src/routes/geminiRoutes");

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/gemini", geminiRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: "Internal server error",
  });
});

// MongoDB connection
let mongoConnection;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!mongoConnection) {
    mongoConnection = mongoose.connect(process.env.MONGO_URI)
      .catch((err) => {
        mongoConnection = null;
        console.error("MongoDB connection failed:", err);
        throw err;
      });
  }

  await mongoConnection;
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing");
    }

    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Backend initialization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Backend initialization failed",
    });
  }
};
