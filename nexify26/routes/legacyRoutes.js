"use strict";

const express = require("express");
const multer = require("multer");
const { randomUUID } = require("crypto");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const legacyDispatchStore = new Map();

// Keeps existing frontend call: POST /api/ocr
router.post("/ocr", upload.single("reportFile"), (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error("reportFile is required.");
      error.status = 400;
      throw error;
    }

    res.json({
      success: true,
      ocr: {
        extractedText: `Mock OCR output from ${req.file.originalname}: Bilateral Pulmonary Effusion with mild cardiomegaly.`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Keeps existing frontend call: POST /api/simplify
router.post("/simplify", (req, res, next) => {
  try {
    const extractedText = req.body?.extractedText;
    if (!extractedText || typeof extractedText !== "string") {
      const error = new Error("extractedText is required.");
      error.status = 400;
      throw error;
    }

    res.json({
      success: true,
      simplified: {
        plainMeaning:
          "The report may indicate fluid around the lungs and heart strain signs. Seek medical review promptly.",
        keyFindings: [
          "Possible fluid in lung areas.",
          "Potential heart stress indicators.",
          "Clinical confirmation required.",
        ],
        nextSteps: [
          "Consult a licensed doctor.",
          "Monitor breathing and oxygen symptoms.",
          "Use SOS if symptoms worsen.",
        ],
        glossary: [
          { term: "bilateral pulmonary effusion", meaning: "Fluid in both lungs." },
          { term: "cardiomegaly", meaning: "Enlarged heart size on imaging." },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Keeps existing frontend call: POST /api/emergency/dispatch
router.post("/emergency/dispatch", (req, res, next) => {
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
    legacyDispatchStore.set(dispatchId, { createdAt: Date.now(), etaMinutes: 12 });

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

// Keeps existing frontend call: GET /api/emergency/track?dispatchId=...
router.get("/emergency/track", (req, res, next) => {
  try {
    const dispatchId = req.query.dispatchId;
    if (!dispatchId) {
      const error = new Error("dispatchId query parameter is required.");
      error.status = 400;
      throw error;
    }

    const item = legacyDispatchStore.get(dispatchId);
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
