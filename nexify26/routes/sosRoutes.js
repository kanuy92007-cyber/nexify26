"use strict";

const express = require("express");
const { randomUUID } = require("crypto");

const router = express.Router();

// In-memory dispatch store for mock live tracking.
const dispatchStore = new Map();

// SOS endpoint requested by user.
router.post("/sos", (req, res, next) => {
  try {
    const emergencyData = req.body || {};
    if (!Object.keys(emergencyData).length) {
      const error = new Error("Emergency data is required.");
      error.status = 400;
      throw error;
    }

    const incidentId = randomUUID();
    res.json({
      success: true,
      message: "Emergency request received. Help is being dispatched.",
      incidentId,
    });
  } catch (error) {
    next(error);
  }
});

// Compatibility endpoint used by current frontend.
router.post("/dispatch", (req, res, next) => {
  try {
    const patientLocation = req.body?.patientLocation;
    if (
      !patientLocation ||
      typeof patientLocation.lat !== "number" ||
      typeof patientLocation.lng !== "number"
    ) {
      const error = new Error("patientLocation with numeric lat/lng is required.");
      error.status = 400;
      throw error;
    }

    const dispatchId = randomUUID();
    const createdAt = Date.now();
    dispatchStore.set(dispatchId, { createdAt, etaMinutes: 12 });

    res.status(201).json({
      success: true,
      dispatch: {
        dispatchId,
        status: "en_route",
        etaMinutes: 12,
        ambulance: { ambulanceId: "AMB-500" },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Compatibility endpoint used by current frontend.
router.get("/track", (req, res, next) => {
  try {
    const dispatchId = req.query.dispatchId;
    if (!dispatchId) {
      const error = new Error("dispatchId query parameter is required.");
      error.status = 400;
      throw error;
    }

    const item = dispatchStore.get(dispatchId);
    if (!item) {
      const error = new Error("Dispatch not found.");
      error.status = 404;
      throw error;
    }

    const elapsedSeconds = Math.floor((Date.now() - item.createdAt) / 1000);
    const totalSeconds = item.etaMinutes * 60;
    const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));
    const etaMinutes = progressPercent >= 100 ? 0 : Math.max(1, Math.ceil((totalSeconds - elapsedSeconds) / 60));

    res.json({
      success: true,
      tracking: {
        dispatchId,
        status: progressPercent >= 100 ? "arrived" : "en_route",
        progressPercent,
        etaMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
