import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, Shield, X, Brain } from 'lucide-react';
import { api } from '../api';
import * as pdfjsLib from 'pdfjs-dist';

// Point PDF.js worker to the local file (Vite handles this via ?url)
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const Upload = ({ onComplete }) => {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [extractStep, setExtractStep] = useState('');

  // ── Extract text from PDF using PDF.js ────────────────────────────────────
  const extractPdfText = async (file) => {
    setExtractStep('Reading PDF pages...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      textParts.push(pageText);
    }
    return textParts.join('\n');
  };

  // ── Convert image to base64 ────────────────────────────────────────────────
  const fileToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]); // strip data: prefix
      reader.readAsDataURL(file);
    });
  };

  // ── Read file content depending on type ───────────────────────────────────
  const readFile = async (file) => {
    if (file.type === 'text/plain') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ type: 'text', content: e.target.result || '' });
        reader.readAsText(file);
      });
    }
    if (file.type === 'application/pdf') {
      const text = await extractPdfText(file);
      if (text.trim().length > 50) {
        return { type: 'text', content: text };
      }
      // Scanned PDF — fallback to image of first page is not trivial; send as vision
      return { type: 'text', content: `PDF file: ${file.name}\n(Scanned or image-based PDF — limited extraction)` };
    }
    if (file.type.startsWith('image/')) {
      setExtractStep('Reading image...');
      const base64 = await fileToBase64(file);
      return { type: 'image', content: base64, mimeType: file.type };
    }
    return { type: 'text', content: `File: ${file.name}` };
  };

  const handleFile = (selectedFile) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Please upload a PDF, JPG, PNG, or TXT file.');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setError('');

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + 10;
      });
    }, 100);

    try {
      setExtractStep('Extracting content...');
      const fileData = await readFile(file);
      clearInterval(interval);
      setProgress(100);
      setStatus('processing');

      const { report } = await api.analyzeReport(
        fileData.type === 'image' ? `[IMAGE_REPORT: ${file.name}]` : fileData.content,
        file.name,
        fileData.type === 'image' ? { base64: fileData.content, mimeType: fileData.mimeType } : null
      );

      onComplete(report);
    } catch (err) {
      clearInterval(interval);
      setError('Analysis failed: ' + err.message);
      setStatus('idle');
      setProgress(0);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '760px', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Upload Your Report</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          We'll simplify it for you — no medical knowledge needed.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('file-input').click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--primary)' : file ? 'var(--secondary)' : '#D1D5DB'}`,
                borderRadius: '20px',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                background: dragging ? 'rgba(37, 99, 235, 0.04)' : file ? 'rgba(34, 197, 94, 0.04)' : 'white'
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.txt"
                style={{ display: 'none' }}
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />

              {!file ? (
                <>
                  <div style={{
                    width: '88px', height: '88px',
                    background: 'rgba(37, 99, 235, 0.08)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <UploadIcon size={44} color="var(--primary)" />
                  </div>
                  <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem' }}>Drag & Drop your report here</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    or click to browse from your device
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {['PDF', 'JPG', 'PNG', 'TXT'].map(t => (
                      <span key={t} style={{ padding: '4px 12px', background: '#F3F4F6', borderRadius: '20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        .{t}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{
                    width: '88px', height: '88px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <FileText size={44} color="var(--secondary)" />
                  </div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--secondary)' }}>File Selected!</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{file.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    style={{ marginTop: '1rem', background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    <X size={14} /> Remove
                  </button>
                </motion.div>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '12px', background: '#FEE2E2', borderRadius: '10px', color: '#991B1B', fontSize: '14px' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <motion.button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file}
                whileHover={file ? { scale: 1.02 } : {}}
                style={{ padding: '16px 40px', fontSize: '16px', opacity: file ? 1 : 0.5, cursor: file ? 'pointer' : 'not-allowed' }}
              >
                <Brain size={22} />
                Analyze with AI
              </motion.button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <Shield size={15} color="var(--secondary)" />
                Your data is secure and private
              </div>
            </div>
          </motion.div>
        )}

        {status === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <FileText size={64} color="var(--primary)" style={{ marginBottom: '2rem' }} />
            <h2 style={{ marginBottom: '1rem' }}>
              {extractStep || 'Reading your report...'}
            </h2>
            <div style={{ width: '100%', height: '10px', background: '#F3F4F6', borderRadius: '5px', overflow: 'hidden', margin: '2rem 0' }}>
              <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), #60a5fa)', borderRadius: '5px' }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
            </div>
            <p style={{ color: 'var(--text-muted)' }}>{progress}%</p>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 2.5rem' }}>
              <motion.div style={{
                position: 'absolute', inset: 0,
                border: '4px solid rgba(37, 99, 235, 0.1)',
                borderTop: '4px solid var(--primary)', borderRight: '4px solid #60a5fa',
                borderRadius: '50%'
              }} animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={52} color="var(--primary)" />
              </div>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>Gemini AI is analyzing your report</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Simplifying complex medical data into clarity...</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', display: 'inline-flex' }}>
              {[
                { done: true,  text: 'File received & content extracted' },
                { done: true,  text: 'Sending to Gemini AI' },
                { done: false, text: 'AI generating insights...' }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {step.done
                    ? <CheckCircle2 size={18} color="var(--secondary)" />
                    : <Loader2 size={18} color="var(--primary)" className="animate-spin-slow" />}
                  <span style={{ color: step.done ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '15px' }}>{step.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Upload;
