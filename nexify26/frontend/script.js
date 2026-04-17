"use strict";

const APP_STATE_KEY = "mediclear_mvp_state";
const API_BASE_URL = localStorage.getItem("mediclear_api_base") || "http://localhost:3000";

function getHealthBanner() {
  return document.getElementById("apiHealthBanner");
}

function setHealthBannerState(stateClass, text) {
  const banner = getHealthBanner();
  if (!banner) return;

  banner.classList.remove("loading", "ok", "error");
  banner.classList.add(stateClass);
  banner.textContent = text;
}

async function checkBackendHealth() {
  setHealthBannerState("loading", `Checking backend: ${API_BASE_URL}`);

  try {
    const healthRes = await apiRequest("/health");
    if (healthRes.ok) {
      setHealthBannerState(
        "ok",
        `Backend online at ${API_BASE_URL} (service: ${healthRes.service})`
      );
      return;
    }
    setHealthBannerState("error", `Backend unhealthy at ${API_BASE_URL}`);
  } catch (_error) {
    setHealthBannerState(
      "error",
      `Backend offline at ${API_BASE_URL}. Start API server to enable upload/SOS.`
    );
  }
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach((link) => {
    const target = link.getAttribute("href").replace("./", "");
    if (target === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to read state:", error);
    return null;
  }
}

function saveState(data) {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(data));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "API request failed.";
    throw new Error(message);
  }

  return data;
}

function renderUploadPreview(container, file) {
  container.classList.remove("hidden");
  container.innerHTML = `
    <h3>Selected File</h3>
    <p><strong>Name:</strong> ${file.name}</p>
    <p><strong>Type:</strong> ${file.type || "Unknown"}</p>
    <p><strong>Size:</strong> ${(file.size / 1024).toFixed(1)} KB</p>
  `;
}

function setupUploadPage() {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  const fileInput = document.getElementById("reportFile");
  const preview = document.getElementById("uploadPreview");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    renderUploadPreview(preview, file);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a report file.");
      return;
    }

    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Unsupported file format. Please upload PNG, JPG, JPEG, or PDF.");
      return;
    }

    const patient = {
      name: document.getElementById("patientName").value.trim(),
      age: document.getElementById("patientAge").value.trim() || "Not specified",
      allergies:
        document.getElementById("allergies").value.trim() || "No known allergies",
      history:
        document.getElementById("history").value.trim() || "No major history provided",
    };

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Processing...";

    try {
      const formData = new FormData();
      formData.append("reportFile", file);

      const ocrRes = await apiRequest("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const simplifyRes = await apiRequest("/api/simplify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedText: ocrRes.ocr.extractedText,
          patient,
        }),
      });

      const report = {
        createdAt: new Date().toISOString(),
        patient,
        fileName: file.name,
        fileType: file.type || "unknown",
        ocrText: ocrRes.ocr.extractedText,
        plainMeaning: simplifyRes.simplified.plainMeaning,
        keyFindings: simplifyRes.simplified.keyFindings || [],
        nextSteps: simplifyRes.simplified.nextSteps || [],
        glossary: simplifyRes.simplified.glossary || [],
      };

      saveState(report);
      window.location.href = "./dashboard.html";
    } catch (error) {
      alert(`Processing failed: ${error.message}`);
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Process Report";
    }
  });
}

function fillList(targetId, values) {
  const list = document.getElementById(targetId);
  if (!list) return;
  list.innerHTML = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    list.appendChild(li);
  });
}

function renderGlossary(items) {
  const glossary = document.getElementById("glossary");
  if (!glossary) return;
  glossary.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "No complex terms identified in this report.";
    glossary.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.term}:</strong> ${item.meaning}`;
    glossary.appendChild(li);
  });
}

function renderHandover(state) {
  const handover = document.getElementById("handoverSummary");
  if (!handover) return;

  handover.innerHTML = `
    <p><strong>Patient:</strong> ${state.patient.name} (${state.patient.age})</p>
    <p><strong>Allergies:</strong> ${state.patient.allergies}</p>
    <p><strong>History:</strong> ${state.patient.history}</p>
    <p><strong>File:</strong> ${state.fileName}</p>
    <p><strong>Essential finding:</strong> ${state.keyFindings[0]}</p>
    <p><strong>Guidance:</strong> ${state.nextSteps[0]}</p>
  `;
}

function setupSOS(state) {
  const button = document.getElementById("sosButton");
  const tracking = document.getElementById("trackingBox");
  const status = document.getElementById("trackingStatus");
  const progress = document.getElementById("ambulanceProgress");
  const etaText = document.getElementById("etaText");
  if (!button) return;

  let timer = null;
  button.addEventListener("click", async () => {
    if (timer) return;

    button.disabled = true;
    tracking.classList.remove("hidden");
    status.textContent = "Requesting dispatch...";
    etaText.textContent = "ETA: Calculating";

    try {
      const dispatchRes = await apiRequest("/api/emergency/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientLocation: { lat: 28.6139, lng: 77.2090 },
          patient: state.patient,
          summary: {
            plainMeaning: state.plainMeaning,
            keyFinding: state.keyFindings[0] || "No finding available",
            allergies: state.patient.allergies,
            history: state.patient.history,
          },
        }),
      });

      const dispatchId = dispatchRes.dispatch.dispatchId;
      status.textContent = `Dispatch confirmed (${dispatchRes.dispatch.ambulance.ambulanceId}). Ambulance en route.`;

      timer = setInterval(async () => {
        try {
          const trackingRes = await apiRequest(
            `/api/emergency/track?dispatchId=${encodeURIComponent(dispatchId)}`
          );
          const trackingData = trackingRes.tracking;
          progress.style.width = `${trackingData.progressPercent}%`;

          if (trackingData.status === "arrived") {
            status.textContent = "Ambulance arrived. Prepare handover summary.";
            etaText.textContent = "ETA: Arrived";
            clearInterval(timer);
            timer = null;
            return;
          }

          etaText.textContent = `ETA: ${trackingData.etaMinutes} min`;
        } catch (trackError) {
          clearInterval(timer);
          timer = null;
          status.textContent = `Tracking failed: ${trackError.message}`;
          etaText.textContent = "ETA: Unavailable";
        }
      }, 2000);
    } catch (dispatchError) {
      status.textContent = `Dispatch failed: ${dispatchError.message}`;
      etaText.textContent = "ETA: Unavailable";
      button.disabled = false;
    }
  });
}

function setupDashboardPage() {
  const plainMeaning = document.getElementById("plainMeaning");
  if (!plainMeaning) return;

  const state = loadState();
  if (!state) {
    plainMeaning.textContent =
      "No report processed yet. Please upload a report to generate insights.";
    fillList("keyFindings", ["Upload a report to view key findings."]);
    fillList("nextSteps", ["Go to the Upload page and process a file."]);
    fillList("glossary", ["Glossary will appear after report processing."]);
    return;
  }

  const reportMeta = document.getElementById("reportMeta");
  reportMeta.textContent = `Processed for ${state.patient.name} | File: ${
    state.fileName
  } | Time: ${new Date(state.createdAt).toLocaleString()}`;

  plainMeaning.textContent = state.plainMeaning;
  fillList("keyFindings", state.keyFindings);
  fillList("nextSteps", state.nextSteps);
  renderGlossary(state.glossary);
  renderHandover(state);
  setupSOS(state);
}

setActiveNav();
checkBackendHealth();
setupUploadPage();
setupDashboardPage();
