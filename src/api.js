// Purely Client-Side API logic to allow Netlify deployment without a backend
const GEMINI_API_KEY = 'AQ.Ab8RN6JbXXvVWN__jdT9WmR9GFLw0g1GcvY2R-xd8pFL5y8ywg';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// Simple mock database using localStorage
const db = {
  getUsers: () => JSON.parse(localStorage.getItem('mediclear_db_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('mediclear_db_users', JSON.stringify(users)),
  getReports: () => JSON.parse(localStorage.getItem('mediclear_db_reports') || '[]'),
  saveReports: (reports) => localStorage.setItem('mediclear_db_reports', JSON.stringify(reports)),
};

const getToken = () => localStorage.getItem('mediclear_token');

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email, password) {
    const users = db.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    
    const token = btoa(user.id + Date.now()); // Fake token
    const userData = { id: user.id, name: user.name, email: user.email };
    return { token, user: userData };
  },

  async register(name, email, password) {
    const users = db.getUsers();
    if (users.find(u => u.email === email)) throw new Error("Email already registered");
    
    const newUser = { id: 'u_' + Date.now(), name, email, password };
    users.push(newUser);
    db.saveUsers(users);
    
    const token = btoa(newUser.id + Date.now());
    const userData = { id: newUser.id, name, email };
    return { token, user: userData };
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  async analyzeReport(reportText, fileName, imageData = null) {
    const prompt = `
      You are an expert medical AI assistant.
      Analyze this medical report. Extract all parameters, their values, units, and normal ranges if present.
      Flag if they are high, low, or normal based on standard medical ranges.
      Generate a short summary and 3-4 recommended actions.
      
      CRITICAL: YOU MUST RETURN ONLY VALID JSON.
      
      Format:
      {
        "patientName": "Extracted name or Unknown",
        "date": "Extracted date or Unknown",
        "summary": "Brief easy to understand summary of the overall health status.",
        "parameters": [
          { "name": "Hemoglobin", "value": "14.2", "unit": "g/dL", "range": "13.0 - 17.0", "status": "normal" }
        ],
        "suggestions": [
          { "title": "Drink water", "desc": "Stay hydrated" }
        ]
      }

      Report Data:
      ${reportText.substring(0, 5000)}
    `;

    const contents = [{
      parts: [{ text: prompt }]
    }];

    if (imageData) {
      contents[0].parts.unshift({
        inline_data: {
          mime_type: imageData.mimeType,
          data: imageData.data
        }
      });
    }

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({ contents })
    });

    const geminiData = await res.json();
    if (geminiData.error) throw new Error(geminiData.error.message);

    try {
      let text = geminiData.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(text);

      // Save to fake local DB
      const report = {
        id: 'r_' + Date.now(),
        fileName,
        date: new Date().toISOString(),
        data: parsedData,
      };
      
      const reports = db.getReports();
      reports.unshift(report);
      db.saveReports(reports);

      return { report };
    } catch (e) {
      throw new Error("Failed to parse Gemini output: " + e.message);
    }
  },

  async getReports() {
    return { reports: db.getReports() };
  },

  async getReport(id) {
    const report = db.getReports().find(r => r.id === id);
    if (!report) throw new Error("Report not found");
    return { report };
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  async chat(message, reportContext, history) {
    let systemInstruction = `You are a helpful, empathetic medical assistant. You are answering questions about the user's medical report. Give concise, easy-to-understand answers.`;
    if (reportContext) {
      systemInstruction += `\nHere is the user's report data:\n${JSON.stringify(reportContext)}`;
    }

    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents
      })
    });

    const geminiData = await res.json();
    if (geminiData.error) throw new Error(geminiData.error.message);

    return { response: geminiData.candidates[0].content.parts[0].text };
  }
};
