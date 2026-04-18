import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Brain, Globe, ShieldCheck } from 'lucide-react';
import NearbyHospitals from '../components/NearbyHospitals';

const Landing = ({ onStart }) => {
  return (
    <div className="container">
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '4rem', 
        alignItems: 'center',
        padding: '4rem 0'
      }}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{ fontSize: '3.5rem', lineHeight: '1.2', marginBottom: '1.5rem' }}>
            Clarity in Every <span style={{ color: 'var(--primary)' }}>Medical Report</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            Understand your health results in simple language. AI-powered analysis that bridges the gap between complex data and your wellbeing.
          </p>
          <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }} onClick={onStart}>
            <Upload size={24} />
            Upload Your Report
          </button>
          
          <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={20} color="var(--secondary)" />
              <span>100% Private</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={20} color="var(--secondary)" />
              <span>Secure Storage</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-card"
          style={{ padding: '1rem', overflow: 'hidden' }}
        >
          <img 
            src="/hero.png" 
            alt="AI Healthcare Illustration" 
            style={{ width: '100%', borderRadius: '12px', display: 'block' }} 
          />
        </motion.div>
      </section>

      {/* ── Quick Tools Bar on Landing Page ── */}
      <section style={{ marginBottom: '4rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1.5px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{
            background: '#F9FAFB',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginRight: '8px' }}>Emergency Quick Tools:</span>

            <button
              onClick={() => document.getElementById('nearby-hospitals-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              🏥 Find Nearby Hospitals
            </button>

            <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              🗺️ Search on Maps
            </a>

            <a href="https://www.google.com/maps/search/hospital+near+me+directions" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              🧭 Get Directions
            </a>

            <a href="https://www.practo.com" target="_blank" rel="noopener noreferrer"
              style={{ padding: '10px 18px', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#F3F4F6'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              👨‍⚕️ Book a Doctor
            </a>
          </div>
        </motion.div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>Why Choose Mediclear?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { 
              icon: <Brain size={40} color="var(--primary)" />, 
              title: "Easy Understanding", 
              desc: "We translate complex medical jargon into friendly, conversational language." 
            },
            { 
              icon: <Brain size={40} color="var(--secondary)" />, 
              title: "AI-Powered Insights", 
              desc: "Deep analysis of your markers to provide actionable health overview." 
            },
            { 
              icon: <Globe size={40} color="var(--primary)" />, 
              title: "Multi-language Support", 
              desc: "Get your reports explained in the language you're most comfortable with." 
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="glass-card" 
              style={{ padding: '2.5rem', textAlign: 'center' }}
            >
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '1rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Nearby Hospitals on Landing Page ── */}
      <section id="nearby-hospitals-section" style={{ padding: '2rem 0 4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '1rem' }}>Need Immediate Care?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Find hospitals near you without uploading a report.
        </p>
        <NearbyHospitals abnormalParams={[]} />
      </section>

      <footer style={{ padding: '4rem 0', borderTop: '1px solid #E5E7EB', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '1rem' }}>&copy; 2024 Mediclear AI. All rights reserved.</p>
        <p style={{ fontSize: '0.875rem', maxWidth: '600px', margin: '0 auto' }}>
          Disclaimer: Mediclear is an AI tool for informational purposes only. It does not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
