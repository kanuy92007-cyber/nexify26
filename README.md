# Mediclear 🏥✨

Mediclear is an AI-powered medical healthcare platform designed to bridge the gap between complex medical reports and patient understanding. By leveraging the power of Google Gemini AI, Mediclear transforms complicated lab results into simple, actionable, and conversational health insights.

![Mediclear Preview](public/hero.png)



## 🚀 Features

*   **Intelligent Report Analysis**: Upload your medical reports (PDF or images). The app parses the text/images locally and uses Gemini AI to extract critical markers, reference ranges, and abnormal parameters.
*   **Plain English Summaries**: Medical jargon is translated into easy-to-understand language.
*   **Nearby Hospitals & Specialist Recommendations**: If your report contains abnormal markers (e.g., high cholesterol), Mediclear automatically maps them to the right specialist (e.g., Cardiologist) and finds the nearest hospitals within a 10km radius using geolocation and the OpenStreetMap Overpass API.
*   **Emergency Quick Actions**: Persistent quick-action bar for instant access to national ambulance (102) and emergency (112) services, as well as turn-by-turn Google Maps directions.
*   **Top Indian Doctors**: Curated suggestions of famous Indian doctors with direct links to book appointments via Practo.
*   **Accessibility First**: Built-in, highly optimized Text-to-Speech (TTS) engine that reads your report out loud in a clear, crisp voice.
*   **Export & Share**: Easily download your analyzed report as a branded, professional PDF or share it across platforms (WhatsApp, Email, Clipboard) using the native Web Share API.
*   **Fully Serverless (Netlify Ready)**: Completely runs in the browser. Uses LocalStorage to manage user authentication and report history, making it perfectly deployable on static hosting services like Netlify.

## 🛠 Technology Stack

*   **Frontend**: React (Vite), Framer Motion (for dynamic animations)
*   **Styling**: Vanilla CSS (Custom Design System with Glassmorphism)
*   **Maps & Routing**: React Leaflet, OpenStreetMap Overpass API
*   **AI Integration**: Google Generative AI (Gemini Flash-Latest Vision Model)
*   **PDF Parsing & Generation**: `pdfjs-dist` (for reading PDFs), `jspdf` (for exporting reports)
*   **Icons**: Lucide React

## 📦 Local Installation & Setup

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd mediclear
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🌐 Deployment (Netlify)

Mediclear is configured to be 100% serverless. To deploy to Netlify:
1. Push this codebase to a GitHub repository.
2. Go to your Netlify Dashboard and click **Add new site** -> **Import an existing project**.
3. Select your GitHub repository.
4. Netlify will automatically detect Vite. Use the following build settings:
   *   **Build command:** `npm run build`
   *   **Publish directory:** `dist`
5. Click **Deploy Site**. Your app will be live and fully functional globally!

## ⚠️ Disclaimer

**Mediclear is an AI tool intended for informational and educational purposes only.** It does not provide medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider or physician with any questions regarding a medical condition. Do not disregard professional medical advice or delay in seeking it because of something you have read on this application.

## 👨‍💻 Contributing

Feel free to open issues and pull requests if you want to contribute to Mediclear!

## 📄 License

&copy; 2026 Mediclear AI.
