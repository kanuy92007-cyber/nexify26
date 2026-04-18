import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Loader2, Stethoscope, Phone, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { FAMOUS_DOCTORS } from './famousDoctors';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 2px 10px rgba(37,99,235,0.5)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9], className: '',
});

const hospitalIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;background:white;border:2px solid #EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,0.3);font-size:14px">🏥</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14], className: '',
});

const MapFlyTo = ({ position }) => {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 13, { duration: 1.5 }); }, [position, map]);
  return null;
};

const SPECIALIST_MAP = [
  { keywords: ['hemoglobin', 'hgb', 'hb', 'rbc', 'red blood', 'iron', 'ferritin'], specialty: 'Hematologist', icon: '🩸', color: '#DC2626' },
  { keywords: ['wbc', 'white blood', 'neutrophil', 'lymphocyte', 'platelet'],       specialty: 'Hematologist / Immunologist', icon: '🦠', color: '#7C3AED' },
  { keywords: ['glucose', 'blood sugar', 'hba1c', 'fasting', 'ppbs'],               specialty: 'Diabetologist / Endocrinologist', icon: '🍬', color: '#D97706' },
  { keywords: ['creatinine', 'urea', 'bun', 'gfr', 'kidney'],                       specialty: 'Nephrologist', icon: '🫘', color: '#2563EB' },
  { keywords: ['sodium', 'potassium', 'electrolyte', 'chloride'],                    specialty: 'Nephrologist / General Physician', icon: '⚡', color: '#0891B2' },
  { keywords: ['uric acid', 'gout'],                                                 specialty: 'Rheumatologist', icon: '🦴', color: '#059669' },
  { keywords: ['sgpt', 'sgot', 'alt', 'ast', 'bilirubin', 'liver', 'ggt'],          specialty: 'Hepatologist / Gastroenterologist', icon: '🫀', color: '#B45309' },
  { keywords: ['cholesterol', 'ldl', 'hdl', 'triglyceride', 'lipid'],               specialty: 'Cardiologist', icon: '❤️', color: '#EF4444' },
  { keywords: ['tsh', 't3', 't4', 'thyroid'],                                        specialty: 'Endocrinologist', icon: '🦋', color: '#0891B2' },
  { keywords: ['vitamin d', 'vitamin b12', 'folate', 'folic'],                       specialty: 'General Physician / Nutritionist', icon: '💊', color: '#7C3AED' },
  { keywords: ['calcium', 'phosphorus', 'bone'],                                     specialty: 'Orthopedist / Endocrinologist', icon: '🦴', color: '#6D28D9' },
];

const getSpecialists = (params) => {
  const found = new Map();
  params.forEach(p => {
    const n = (p.name || '').toLowerCase();
    for (const e of SPECIALIST_MAP) {
      if (e.keywords.some(k => n.includes(k)) && !found.has(e.specialty))
        found.set(e.specialty, { ...e, param: p.name });
    }
  });
  if (found.size === 0) found.set('General Physician', { specialty: 'General Physician', icon: '👨‍⚕️', color: '#2563EB', param: 'Multiple parameters' });
  return Array.from(found.values());
};

const distKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371, r = d => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Main Component ─────────────────────────────────────────────────────────────
const NearbyHospitals = ({ abnormalParams }) => {
  const [phase, setPhase]         = useState('idle');
  const [userPos, setUserPos]     = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [errMsg, setErrMsg]       = useState('');
  const [expanded, setExpanded]   = useState(true);
  const specialists = getSpecialists(abnormalParams);

  // Collect all famous doctors relevant to found specialties
  const famousDocs = specialists.flatMap(s => FAMOUS_DOCTORS[s.specialty] || []).filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);

  const findHospitals = useCallback(async () => {
    setPhase('locating'); setErrMsg('');
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 12000, enableHighAccuracy: true })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setUserPos([lat, lon]);
      setPhase('fetching');

      const q = `[out:json][timeout:25];(node["amenity"="hospital"](around:10000,${lat},${lon});way["amenity"="hospital"](around:10000,${lat},${lon}););out center;`;
      const json = await (await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })).json();

      const results = (json.elements || [])
        .map(el => ({
          id: el.id, name: el.tags?.name || '',
          lat: el.lat ?? el.center?.lat, lon: el.lon ?? el.center?.lon,
          phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
          website: el.tags?.website || null,
          emergency: el.tags?.emergency === 'yes',
          beds: el.tags?.beds || null,
        }))
        .filter(h => h.lat && h.lon && h.name)
        .map(h => ({ ...h, dist: distKm(lat, lon, h.lat, h.lon) }))
        .sort((a, b) => a.dist - b.dist).slice(0, 12);

      setHospitals(results);
      setPhase('done');
    } catch (err) {
      setErrMsg(err.code === 1 ? 'Location access denied. Please allow location and try again.' : 'Could not find hospitals. Check your internet and retry.');
      setPhase('error');
    }
  }, []);

  const sectionBorder = { border: '1.5px solid rgba(239,68,68,0.18)', borderRadius: '16px', overflow: 'hidden', marginTop: '2.5rem' };

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={sectionBorder}>

      {/* ── 🚑 Emergency Bar ── */}
      <div style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
          <span style={{ fontSize: '22px' }}>🚑</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Medical Emergency?</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Call national ambulance immediately</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="tel:102" style={{ padding: '8px 18px', background: 'white', color: '#DC2626', fontWeight: 800, fontSize: '15px', borderRadius: '30px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
            📞 102 — Ambulance
          </a>
          <a href="tel:112" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '14px', borderRadius: '30px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.5)' }}>
            112 — Emergency
          </a>
        </div>
      </div>

      {/* ── Header ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', background: 'rgba(239,68,68,0.04)', cursor: 'pointer', userSelect: 'none', borderTop: '1px solid rgba(239,68,68,0.1)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} color="#EF4444" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>🏥 Nearby Hospitals &amp; Top Doctors</div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>{abnormalParams.length} result{abnormalParams.length !== 1 ? 's' : ''} need attention</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(phase === 'idle' || phase === 'error') && (
            <motion.button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '13px' }}
              onClick={e => { e.stopPropagation(); setExpanded(true); findHospitals(); }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              <Navigation size={13} /> {phase === 'error' ? 'Retry' : 'Find Hospitals'}
            </motion.button>
          )}
          {expanded ? <ChevronUp size={17} color="#9CA3AF" /> : <ChevronDown size={17} color="#9CA3AF" />}
        </div>
      </div>

      {/* ── Body ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'white', borderTop: '1px solid #F3F4F6', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem' }}>

              {/* Specialist Chips */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Stethoscope size={15} color="#2563EB" /> Recommended Specialists
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {specialists.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: `${s.color}12`, border: `1.5px solid ${s.color}30`, borderRadius: '24px', fontSize: '13px', fontWeight: 600, color: s.color }}>
                    <span>{s.icon}</span><span>{s.specialty}</span>
                    <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '11px' }}>({s.param})</span>
                  </motion.div>
                ))}
              </div>

              {/* Famous Doctors */}
              {famousDocs.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} color="#D97706" fill="#D97706" /> Top Specialists (India)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {famousDocs.map((doc, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ padding: '14px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>👨‍⚕️ {doc.name}</div>
                        <div style={{ fontSize: '12px', color: '#6B7280' }}>🏥 {doc.hospital}</div>
                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{doc.expertise}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <a href={doc.practo} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '4px 10px', background: '#2563EB', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                            Book on Practo ↗
                          </a>
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(doc.name + ' doctor appointment')}`} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '4px 10px', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                            Search on Google
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {(phase === 'locating' || phase === 'fetching') && (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <Loader2 size={32} color="#2563EB" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <p style={{ fontWeight: 600, color: '#374151' }}>{phase === 'locating' ? 'Getting your location...' : 'Finding hospitals nearby...'}</p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF' }}>{phase === 'locating' ? 'Please allow location access in your browser' : 'Searching within 10 km radius'}</p>
                </div>
              )}

              {/* Error */}
              {phase === 'error' && (
                <div style={{ padding: '1rem', background: '#FEE2E2', borderRadius: '10px', color: '#991B1B', fontSize: '14px' }}>⚠️ {errMsg}</div>
              )}

              {/* Map + List */}
              {phase === 'done' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Map */}
                  <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB', height: '360px', marginBottom: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                    <MapContainer center={userPos} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapFlyTo position={userPos} />
                      <Marker position={userPos} icon={userIcon}><Popup><b>📍 Your Location</b></Popup></Marker>
                      {hospitals.map(h => (
                        <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon}>
                          <Popup>
                            <div style={{ minWidth: '170px' }}>
                              <b style={{ fontSize: '13px' }}>🏥 {h.name}</b><br />
                              <span style={{ fontSize: '12px', color: '#6B7280' }}>📍 {h.dist.toFixed(1)} km</span>
                              {h.emergency && <><br /><span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>🚨 Emergency Dept.</span></>}
                              {h.phone && <><br /><a href={`tel:${h.phone}`} style={{ fontSize: '12px', color: '#2563EB' }}>📞 {h.phone}</a></>}
                              <br />
                              <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2563EB', marginTop: '4px', display: 'inline-block' }}>Get Directions ↗</a>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  {/* Hospital List */}
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#EF4444" /> {hospitals.length} Hospitals Found Nearby
                  </h3>

                  {hospitals.length === 0 && (
                    <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', padding: '1rem' }}>
                      No hospitals found within 10km. <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB' }}>Search on Google Maps ↗</a>
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {hospitals.map((h, i) => (
                      <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: i === 0 ? 'rgba(37,99,235,0.05)' : 'white', border: `1.5px solid ${i === 0 ? 'rgba(37,99,235,0.2)' : '#F3F4F6'}`, borderRadius: '12px' }}>
                        {/* Rank */}
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: i === 0 ? '#2563EB' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: i === 0 ? 'white' : '#6B7280' }}>
                          {i + 1}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.name}
                            {h.emergency && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#DC2626', fontWeight: 700, background: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>EMERGENCY</span>}
                            {i === 0 && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#2563EB', fontWeight: 700, background: 'rgba(37,99,235,0.1)', padding: '1px 5px', borderRadius: '4px' }}>NEAREST</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span>📍 {h.dist.toFixed(1)} km</span>
                            {h.beds && <span>🛏 {h.beds} beds</span>}
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                          {/* Call hospital or ambulance */}
                          <a href={h.phone ? `tel:${h.phone}` : 'tel:102'}
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: '#FEE2E2', color: '#DC2626', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #FECACA' }}>
                            <Phone size={11} /> {h.phone ? 'Call' : '🚑 102'}
                          </a>
                          {/* Directions */}
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#2563EB', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Navigation size={11} /> Directions
                          </a>
                          {/* Website */}
                          {h.website && (
                            <a href={h.website} target="_blank" rel="noopener noreferrer"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: '1px solid #E5E7EB', color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <p style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '1rem', textAlign: 'center' }}>
                    Hospital data from OpenStreetMap. Always call ahead to confirm availability.
                  </p>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default NearbyHospitals;
