import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Volume2, VolumeX, Square, AlertCircle, CheckCircle, User, Calendar, TrendingUp, MessageCircle, Mail, Copy, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import NearbyHospitals from '../components/NearbyHospitals';

const Dashboard = ({ report }) => {
  const data = report?.data || {};
  const parameters = data.parameters || [];
  const suggestions = data.suggestions || [];

  // ── Text-to-Speech (bulletproof) ────────────────────────────────────────────
  const [ttsState, setTtsState] = useState('idle'); // 'idle' | 'speaking' | 'paused'
  const keepAliveRef = useRef(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Cancel speech and cleanup when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      clearInterval(keepAliveRef.current);
    };
  }, []);

  // Build a clean, readable script
  const buildScript = () => {
    const parts = [];
    parts.push('Hello. This is your Mediclear health report.');

    if (data.summary) {
      parts.push(data.summary.replace(/[-–—]/g, ',').replace(/[*_()\[\]]/g, ''));
    }

    if (parameters.length) {
      parts.push(`You have ${parameters.length} test results.`);
      parameters.forEach((p, i) => {
        const statusText =
          p.status === 'normal' ? 'This is normal.' :
          p.status === 'high'   ? 'This is high. Please consult your doctor.' :
                                  'This is low. Please consult your doctor.';
        parts.push(
          `Result ${i + 1}. ${p.name}. ` +
          `Your value is ${p.value}. ` +
          `${statusText} ` +
          `${p.explanation.replace(/[*_()\[\]]/g, '')}`
        );
      });
    }

    if (suggestions.length) {
      parts.push('Here are your health tips.');
      suggestions.forEach((s, i) => parts.push(`Tip ${i + 1}. ${s.title}. ${s.desc}`));
    }

    parts.push('End of report. Please consult your doctor for medical advice. Take care.');
    return parts.join(' ');
  };

  const stopTTS = () => {
    clearInterval(keepAliveRef.current);
    window.speechSynthesis.cancel();
    setTtsState('idle');
  };

  const handleListen = () => {
    const synth = window.speechSynthesis;

    // PAUSE
    if (ttsState === 'speaking') {
      synth.pause();
      clearInterval(keepAliveRef.current);
      setTtsState('paused');
      return;
    }

    // RESUME
    if (ttsState === 'paused') {
      synth.resume();
      // Restart keepAlive for Chrome bug
      keepAliveRef.current = setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        }
      }, 10000);
      setTtsState('speaking');
      return;
    }

    // START — cancel any existing speech first
    synth.cancel();
    clearInterval(keepAliveRef.current);

    // Small delay after cancel() to let browser reset cleanly
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(buildScript());
      utterance.rate   = 0.9;
      utterance.pitch  = 1.0;
      utterance.volume = 1.0;
      utterance.lang   = 'en-US';

      // Pick the best available English voice
      const voices = synth.getVoices();
      const pick = (name) => voices.find(v => v.name === name);
      const best =
        pick('Samantha') ||      // macOS — very clear
        pick('Alex') ||          // macOS — deep & clear
        pick('Karen') ||         // macOS Australian
        pick('Daniel') ||        // macOS UK
        voices.find(v => v.name.includes('Google US English')) ||
        voices.find(v => v.lang === 'en-US' && v.localService) ||
        voices.find(v => v.lang.startsWith('en'));
      if (best) utterance.voice = best;

      utterance.onstart = () => {
        setTtsState('speaking');
        // Chrome bug fix: browser silently pauses after ~15s for long texts
        // Workaround: nudge it every 10s
        keepAliveRef.current = setInterval(() => {
          if (synth.speaking && !synth.paused) {
            synth.pause();
            synth.resume();
          }
        }, 10000);
      };

      utterance.onend = () => {
        clearInterval(keepAliveRef.current);
        setTtsState('idle');
      };

      utterance.onerror = (e) => {
        // 'interrupted' is expected when we call cancel() ourselves — ignore it
        if (e.error === 'interrupted') return;
        clearInterval(keepAliveRef.current);
        setTtsState('idle');
      };

      synth.speak(utterance);
    }, 200);
  };

  // ──────────────────────────────────────────────────────────────────────────


  const getStatusBadge = (status) => {
    switch (status) {
      case 'high': return <span className="badge badge-high">🔴 High</span>;
      case 'low': return <span className="badge badge-low">🟡 Low</span>;
      default: return <span className="badge badge-normal">🟢 Normal</span>;
    }
  };

  const abnormal = parameters.filter(p => p.status !== 'normal').length;
  const normal   = parameters.filter(p => p.status === 'normal').length;

  // ── PDF Download ────────────────────────────────────────────────────────────
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const margin = 18;
      let y = 0;

      // ── Helper: add new page if needed ──
      const checkPage = (needed = 20) => {
        if (y + needed > H - 20) {
          doc.addPage();
          y = 20;
        }
      };

      // ── HEADER BANNER ──
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, W, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Mediclear', margin, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('AI-Powered Medical Report Summary', margin, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`, W - margin, 20, { align: 'right' });

      y = 38;

      // ── REPORT META ──
      doc.setTextColor(17, 24, 39);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(report?.name || 'Medical Report', margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Report Date: ${report?.date || 'N/A'}`, margin, y);
      y += 10;

      // ── DIVIDER ──
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.4);
      doc.line(margin, y, W - margin, y);
      y += 8;

      // ── AI SUMMARY ──
      if (data.summary) {
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(margin, y, W - margin * 2, 28, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235);
        doc.text('AI Health Summary', margin + 5, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        const summaryLines = doc.splitTextToSize(data.summary, W - margin * 2 - 10);
        doc.text(summaryLines, margin + 5, y + 16);
        y += 34;
      }

      // ── STATS ROW ──
      checkPage(24);
      const boxW = (W - margin * 2 - 8) / 3;
      [
        { label: 'Total Markers', val: parameters.length, color: [37, 99, 235],  bg: [239, 246, 255] },
        { label: 'Normal',        val: normal,             color: [22, 101, 52],  bg: [220, 252, 231] },
        { label: 'Needs Attention', val: abnormal,         color: [153, 27, 27],  bg: [254, 226, 226] }
      ].forEach(({ label, val, color, bg }, i) => {
        const bx = margin + i * (boxW + 4);
        doc.setFillColor(...bg);
        doc.roundedRect(bx, y, boxW, 18, 3, 3, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...color);
        doc.text(String(val), bx + boxW / 2, y + 10, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(label, bx + boxW / 2, y + 16, { align: 'center' });
      });
      y += 26;

      // ── PARAMETERS TABLE ──
      checkPage(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(17, 24, 39);
      doc.text('Test Results', margin, y);
      y += 8;

      // Table header
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, y, W - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Parameter',   margin + 3,           y + 5.5);
      doc.text('Value',       margin + 65,           y + 5.5);
      doc.text('Status',      margin + 100,          y + 5.5);
      doc.text('What it means', margin + 125,        y + 5.5);
      y += 8;

      // Table rows
      parameters.forEach((p, idx) => {
        const statusColors = {
          normal: { bg: [220, 252, 231], text: [22, 101, 52],  label: 'NORMAL' },
          high:   { bg: [254, 226, 226], text: [153, 27, 27],  label: 'HIGH'   },
          low:    { bg: [254, 243, 199], text: [146, 64, 14],  label: 'LOW'    },
        };
        const sc = statusColors[p.status] || statusColors.normal;

        // Wrap explanation
        const expLines = doc.splitTextToSize(p.explanation || '', 60);
        const rowH = Math.max(10, expLines.length * 5 + 4);
        checkPage(rowH + 2);

        // Row background (alternating)
        doc.setFillColor(idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 251 : 255);
        doc.rect(margin, y, W - margin * 2, rowH, 'F');

        // Parameter name
        doc.setTextColor(17, 24, 39);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(p.name || '', margin + 3, y + 6);

        // Value
        doc.setFont('helvetica', 'normal');
        doc.text(p.value || '', margin + 65, y + 6);

        // Status badge
        doc.setFillColor(...sc.bg);
        doc.roundedRect(margin + 97, y + 1.5, 22, 6, 2, 2, 'F');
        doc.setTextColor(...sc.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(sc.label, margin + 108, y + 5.8, { align: 'center' });

        // Explanation
        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(expLines, margin + 125, y + 5);

        // Row border
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.line(margin, y + rowH, W - margin, y + rowH);

        y += rowH;
      });

      y += 8;

      // ── HEALTH TIPS ──
      if (suggestions.length) {
        checkPage(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(17, 24, 39);
        doc.text('Health Tips & Recommendations', margin, y);
        y += 8;

        suggestions.forEach((s, i) => {
          checkPage(14);
          doc.setFillColor(240, 253, 244);
          const tipLines = doc.splitTextToSize(`${s.desc}`, W - margin * 2 - 14);
          const tipH = Math.max(12, tipLines.length * 5 + 6);
          doc.roundedRect(margin, y, W - margin * 2, tipH, 3, 3, 'F');
          doc.setFillColor(34, 197, 94);
          doc.circle(margin + 6, y + tipH / 2, 3, 'F');
          doc.setTextColor(22, 163, 74);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(s.title, margin + 12, y + 6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(55, 65, 81);
          doc.setFontSize(8.5);
          doc.text(tipLines, margin + 12, y + 11);
          y += tipH + 4;
        });
      }

      // ── FOOTER ──
      const footerY = H - 14;
      doc.setFillColor(249, 250, 251);
      doc.rect(0, footerY - 4, W, 18, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(0, footerY - 4, W, footerY - 4);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        '⚕ Disclaimer: This report summary is AI-generated for informational purposes only. It is NOT a medical diagnosis. Please consult a qualified doctor.',
        W / 2, footerY + 1, { align: 'center', maxWidth: W - 20 }
      );
      doc.text('Powered by Mediclear AI', W / 2, footerY + 7, { align: 'center' });

      // Save
      const filename = `Mediclear_Report_${(report?.name || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const getShareText = () => {
    return `Mediclear Report Summary (${report?.name || 'Report'})\nDate: ${report?.date || 'N/A'}\n\nSummary: ${data.summary || 'N/A'}\n\nKey Parameters:\n${parameters.map(p => `- ${p.name}: ${p.value} (${p.status.toUpperCase()})`).join('\n')}\n\nSuggestions:\n${suggestions.map(s => `- ${s.title}`).join('\n')}\n\nGenerated by Mediclear AI`;
  };

  const shareVia = async (platform) => {
    const text = getShareText();
    setShowShareMenu(false);

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent('Mediclear Health Report')}&body=${encodeURIComponent(text)}`;
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({ title: 'Mediclear Health Report', text });
          } catch (err) {
            console.log('Share error or cancelled:', err);
          }
        }
        break;
      case 'copy':
      default:
        try {
          await navigator.clipboard.writeText(text);
          alert('Report details copied to clipboard!');
        } catch (err) {
          alert('Failed to copy to clipboard.');
        }
        break;
    }
  };


  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Your Health Overview</h1>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={17} /> {report?.name || 'Medical Report'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={17} /> {report?.date || 'Today'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {/* Listen button — cycles: Listen → Pause → Resume, with Stop */}
          <motion.button
            className={`btn ${ttsState !== 'idle' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '10px 16px', fontSize: '14px' }}
            onClick={handleListen}
            title={ttsState === 'speaking' ? 'Pause' : ttsState === 'paused' ? 'Resume' : 'Listen to report'}
            animate={ttsState === 'speaking' ? { boxShadow: ['0 0 0 0 rgba(37,99,235,0.3)', '0 0 0 8px rgba(37,99,235,0)', '0 0 0 0 rgba(37,99,235,0)'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {ttsState === 'speaking' ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {ttsState === 'speaking' ? 'Pause' : ttsState === 'paused' ? 'Resume' : 'Listen'}
          </motion.button>
          {ttsState !== 'idle' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn btn-secondary"
              style={{ padding: '10px 16px', fontSize: '14px' }}
              onClick={stopTTS}
            >
              <Square size={18} /> Stop
            </motion.button>
          )}

          <motion.button
            className="btn btn-secondary"
            style={{ padding: '10px 16px', fontSize: '14px', opacity: pdfLoading ? 0.7 : 1 }}
            onClick={downloadPDF}
            disabled={pdfLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download size={18} /> {pdfLoading ? 'Generating...' : 'PDF'}
          </motion.button>
          
          <div style={{ position: 'relative' }}>
            <motion.button
              className="btn btn-primary"
              style={{ padding: '10px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowShareMenu(!showShareMenu)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Share2 size={18} /> Share <ChevronDown size={14} />
            </motion.button>

            {/* Share Dropdown Menu */}
            {showShareMenu && (
              <>
                {/* Invisible overlay to close menu when clicking outside */}
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                  onClick={() => setShowShareMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    padding: '8px',
                    zIndex: 50,
                    minWidth: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button 
                    onClick={() => shareVia('whatsapp')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#111827', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <MessageCircle size={16} color="#25D366" /> WhatsApp
                  </button>
                  <button 
                    onClick={() => shareVia('email')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#111827', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Mail size={16} color="#EA4335" /> Email
                  </button>
                  {navigator.share && (
                    <button 
                      onClick={() => shareVia('native')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#111827', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Share2 size={16} color="#2563EB" /> More Options...
                    </button>
                  )}
                  <div style={{ height: '1px', background: '#E5E7EB', margin: '4px 0' }} />
                  <button 
                    onClick={() => shareVia('copy')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#111827', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Copy size={16} color="#6B7280" /> Copy to Clipboard
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Markers', value: parameters.length, color: 'var(--primary)', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Normal', value: normal, color: 'var(--secondary)', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Needs Attention', value: abnormal, color: abnormal > 0 ? 'var(--danger)' : 'var(--secondary)', bg: abnormal > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ background: stat.bg, borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}
          >
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: stat.color, fontFamily: 'Poppins, sans-serif' }}>
              {stat.value}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Emergency Quick-Action Bar (shown when there are abnormal results) ── */}
      {abnormal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            marginBottom: '2rem',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1.5px solid rgba(239,68,68,0.25)',
            boxShadow: '0 4px 20px rgba(239,68,68,0.1)',
          }}
        >
          {/* Top row — emergency numbers */}
          <div style={{
            background: 'linear-gradient(90deg, #B91C1C, #DC2626, #EF4444)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
              <span style={{ fontSize: '20px' }}>🚨</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{abnormal} result{abnormal !== 1 ? 's' : ''} need medical attention</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Call emergency services or find a hospital near you</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="tel:102"
                style={{ padding: '8px 18px', background: 'white', color: '#DC2626', fontWeight: 800, fontSize: '14px', borderRadius: '30px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>
                🚑 Call 102 – Ambulance
              </a>
              <a href="tel:112"
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700, fontSize: '13px', borderRadius: '30px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                📞 112 – Emergency
              </a>
            </div>
          </div>

          {/* Bottom row — navigation actions */}
          <div style={{
            background: '#FFF5F5',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#7F1D1D', marginRight: '4px' }}>Quick Actions:</span>

            {/* Find Hospitals — scrolls to the NearbyHospitals section */}
            <button
              onClick={() => document.getElementById('nearby-hospitals-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '8px 14px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🏥 Find Nearby Hospitals
            </button>

            {/* Google Maps search */}
            <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🗺️ Search on Maps
            </a>

            {/* Directions to nearest hospital via Google */}
            <a href="https://www.google.com/maps/search/hospital+near+me+directions" target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧭 Get Directions
            </a>

            {/* Practo for doctor booking */}
            <a href="https://www.practo.com" target="_blank" rel="noopener noreferrer"
              style={{ padding: '8px 14px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              👨‍⚕️ Book a Doctor
            </a>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

        {/* Report Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {parameters.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No parameters found in this report.
            </div>
          ) : (
            parameters.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card"
                style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}
              >
                <div style={{
                  width: '56px', height: '56px', flexShrink: 0,
                  background: item.status === 'normal' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {item.status === 'normal'
                    ? <CheckCircle size={26} color="var(--secondary)" />
                    : <AlertCircle size={26} color="var(--danger)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>{item.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{item.value}</span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.explanation}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card"
            style={{ padding: '1.75rem', background: 'linear-gradient(135deg, var(--primary), #1D4ED8)', color: 'white' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <TrendingUp size={20} />
              <h3 style={{ color: 'white', fontSize: '1rem' }}>AI Summary</h3>
            </div>
            <p style={{ opacity: 0.92, fontSize: '14px', lineHeight: 1.7 }}>
              {data.summary || 'Your report has been analyzed. Scroll down to see individual parameter details.'}
            </p>
          </motion.div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass-card" style={{ padding: '1.75rem' }}
            >
              <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Recommended Actions</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {suggestions.map((action, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '7px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px' }}>{action.title}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{action.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <div style={{ padding: '1rem 1.25rem', background: '#FEF3C7', borderRadius: '12px', fontSize: '13px', color: '#92400E', lineHeight: 1.6 }}>
            ⚕️ <strong>Disclaimer:</strong> This is not a medical diagnosis. Please consult a qualified doctor for medical decisions.
          </div>
        </aside>
      </div>

      {/* ── Nearby Hospitals (shown when there are abnormal parameters) ── */}
      {abnormal > 0 && (
        <div id="nearby-hospitals-section">
          <NearbyHospitals
            abnormalParams={parameters.filter(p => p.status !== 'normal')}
          />
        </div>
      )}

    </div>
  );
};

export default Dashboard;
