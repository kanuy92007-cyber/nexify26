"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/healthRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const simplifyRoutes = require("./routes/simplifyRoutes");
const sosRoutes = require("./routes/sosRoutes");
const legacyRoutes = require("./routes/legacyRoutes");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Allow browser clients (frontend) to call backend APIs.
app.use(cors());

// Parse JSON request bodies.
app.use(express.json());

// Simple request logger to help debug API calls.
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Primary endpoints requested by user.
app.use("/", healthRoutes);
app.use("/", uploadRoutes);
app.use("/", simplifyRoutes);
app.use("/", sosRoutes);

// Compatibility endpoints so existing frontend code works unchanged.
app.use("/api", legacyRoutes);

// Catch unknown routes.
app.use((req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Global error handler.
app.use((error, _req, res, _next) => {
  const statusCode = error.status || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
