"use strict";

const express = require("express");

const router = express.Router();

// Health check endpoint requested by user.
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

module.exports = router;
