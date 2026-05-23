// src/index.js
// NoteVault API — Express Server Entry Point

require("dotenv").config();
const { validateEnv } = require("./config/validateEnv");
const express = require("express");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const healthRoutes = require("./routes/health");

validateEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "NoteVault API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 NoteVault API running on port ${PORT}`);
});
