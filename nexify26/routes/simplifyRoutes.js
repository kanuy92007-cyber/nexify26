"use strict";

const express = require("express");

const router = express.Router();

// Dummy medical text simplification endpoint.
router.post("/simplify", (req, res, next) => {
  try {
    const medicalText = req.body?.medicalText || req.body?.extractedText;
    if (!medicalText || typeof medicalText !== "string") {
      const error = new Error("medicalText (or extractedText) must be a non-empty string.");
      error.status = 400;
      throw error;
    }

    res.json({
      success: true,
      simplifiedText:
        "This report mentions lung fluid and breathing stress. Please consult a doctor soon.",
      sections: {
        plainMeaning:
          "Possible breathing-related issues are mentioned. This is not a diagnosis.",
        keyFindings: [
          "Possible fluid around the lungs.",
          "Possible breathing strain indicators.",
        ],
        nextSteps: [
          "Share this report with a licensed medical professional.",
          "Use emergency support if symptoms worsen.",
        ],
      },
      sourceLength: medicalText.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
