import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '../api';

const History = ({ onSelect }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReports()
      .then(d => setReports(d.reports))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Report History</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Your previously analyzed medical reports.</p>

      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={40} className="animate-spin-slow" style={{ margin: '0 auto 1rem' }} />
          <p>Loading reports...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#FEE2E2', borderRadius: '12px', color: '#991B1B' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No reports yet</h3>
          <p>Upload your first medical report to get started.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {reports.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card"
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}
            onClick={() => onSelect(item)}
          >
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText color="var(--primary)" size={26} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {item.date}
                  </div>
                  {item.data?.parameters && (
                    <>
                      <span>•</span>
                      <span>{item.data.parameters.length} parameters analyzed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight color="var(--text-muted)" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default History;
