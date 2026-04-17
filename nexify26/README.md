# MediClear & Rescue

Medical report simplifier and emergency response MVP.

MediClear & Rescue bridges complex clinical language and patient understanding. It also includes an SOS flow that prepares emergency context and tracks dispatch progress.

## Current Architecture

- `server.js`: main backend entry (Express server, CORS, JSON middleware, logging, error handling)
- `routes/`: API route modules
- `frontend/`: static web pages (`index.html`, `upload.html`, `dashboard.html`, `style.css`, `script.js`)

## Features Included

### AI Report Simplification (Mocked)
- Upload report files from frontend flow
- Mock OCR extraction endpoint
- Simplification endpoint that returns:
  - plain meaning
  - key findings
  - next steps
  - glossary

### Emergency Rescue (Mocked)
- SOS dispatch endpoint
- Live tracking endpoint with ETA/progress simulation
- Paramedic-style handover summary on dashboard

## Prerequisites

- Node.js 16+ (Node 18+ recommended)
- npm

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create environment file:

```bash
cp .env.example .env
```

3) Start backend server:

```bash
npm run dev
```

Backend runs on:

- `http://localhost:5000`

## Run Frontend

Serve `frontend/` using any static server (example):

```bash
python3 -m http.server 4173
```

Then open:

- `http://127.0.0.1:4173/frontend/index.html`

## Frontend API Base URL

The frontend reads API base URL from localStorage key `mediclear_api_base`.

Set it once in browser console:

```js
localStorage.setItem("mediclear_api_base", "http://localhost:5000");
location.reload();
```

## API Endpoints

### Core Endpoints

- `GET /health` -> `{ "status": "ok" }`
- `POST /upload` (file or text; mock success response)
- `POST /simplify` (medical text input; mock simplified output)
- `POST /sos` (emergency payload; mock success response)

### Frontend Compatibility Endpoints

These are kept so existing frontend code works unchanged:

- `POST /api/ocr`
- `POST /api/simplify`
- `POST /api/emergency/dispatch`
- `GET /api/emergency/track?dispatchId=<id>`

## Quick Verification

1) Open Home page and confirm backend health banner is green.
2) Upload a sample file and process report.
3) Confirm dashboard renders simplified data.
4) Trigger SOS and confirm ETA/progress updates.

## Notes

- Current AI/OCR/maps behavior is mocked for MVP speed.
- Replace mocked responses with real providers (Gemini/OpenAI + Vision/Textract + Maps) in next phase.
