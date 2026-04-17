"use strict";

const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint accepts either multipart file input or raw text input.
router.post("/upload", upload.single("reportFile"), (req, res, next) => {
  try {
    const file = req.file;
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!file && !text) {
      const error = new Error("Provide either reportFile (multipart) or text.");
      error.status = 400;
      throw error;
    }

    res.json({
      success: true,
      message: "Upload received successfully (mock).",
      payload: {
        hasFile: Boolean(file),
        hasText: Boolean(text),
        fileName: file ? file.originalname : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
