import React, { useState, useEffect } from 'react';
import { X, Palette, Type, Maximize } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Local state for live preview
  const [settings, setSettings] = useState({
    themeColor: localStorage.getItem('themeColor') || '#2563eb',
    bgColor: localStorage.getItem('bgColor') || '#ffffff',
    fontFamily: localStorage.getItem('fontFamily') || "'Nunito', sans-serif",
    appScale: localStorage.getItem('appScale') || '100%',
  });

  const applySettings = (newSettings) => {
    const root = document.documentElement;
    
    // Process Accent Color & Create Pastel
    root.style.setProperty('--primary-accent', newSettings.themeColor);
    // Rough simulation of pastel (adds transparency)
    root.style.setProperty('--primary-pastel', `${newSettings.themeColor}33`); // 20% opacity HEX

    // Process Background
    root.style.setProperty('--bg-main', newSettings.bgColor);

    // Process Font
    document.body.style.fontFamily = newSettings.fontFamily;

    // Process Scale/Size using CSS zoom on container, or transform on root
    // Only standard browsers, zoom is simplest for React.
    document.body.style.zoom = newSettings.appScale === '110%' ? '1.1' : (newSettings.appScale === '90%' ? '0.9' : '1');
    
    // Save to localStorage
    localStorage.setItem('themeColor', newSettings.themeColor);
    localStorage.setItem('bgColor', newSettings.bgColor);
    localStorage.setItem('fontFamily', newSettings.fontFamily);
    localStorage.setItem('appScale', newSettings.appScale);
    
    setSettings(newSettings);
  };

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    applySettings(next);
  };

  // Reset to default
  const resetToDefault = () => {
    const def = {
      themeColor: '#2563eb',
      bgColor: '#ffffff',
      fontFamily: "'Nunito', -apple-system, sans-serif",
      appScale: '100%',
    };
    applySettings(def);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button
          className="btn-icon"
          style={{ position: 'absolute', top: '24px', right: '24px', width: '36px', height: '36px' }}
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="modal-header">
          <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>App Settings</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Customize colors, typography and scaling.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Màu sắc chủ đạo */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              <Palette size={16} /> Primary Accent Color
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="color" 
                value={settings.themeColor} 
                onChange={(e) => update('themeColor', e.target.value)}
                style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              />
              <span style={{ alignSelf: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>{settings.themeColor}</span>
            </div>
          </div>

          {/* Màu nền */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              <Palette size={16} /> Background Color
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="color" 
                value={settings.bgColor} 
                onChange={(e) => update('bgColor', e.target.value)}
                style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              />
              <span style={{ alignSelf: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>{settings.bgColor}</span>
            </div>
          </div>

          {/* Font chữ */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              <Type size={16} /> Typography
            </label>
            <select 
              className="form-group"
              style={{ padding: '10px 14px', width: '100%', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none', background: 'var(--bg-main)', fontFamily: settings.fontFamily }}
              value={settings.fontFamily}
              onChange={(e) => update('fontFamily', e.target.value)}
            >
              <option value="'Nunito', sans-serif">Nunito (Default)</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Comic Sans MS', cursive">Comic Sans (Fun)</option>
              <option value="'Segoe UI', sans-serif">System UI</option>
            </select>
          </div>

          {/* Kích cỡ */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              <Maximize size={16} /> Display Scale
            </label>
            <select 
              className="form-group"
              style={{ padding: '10px 14px', width: '100%', borderRadius: '10px', border: '1px solid var(--border-light)', outline: 'none', background: 'var(--bg-main)' }}
              value={settings.appScale}
              onChange={(e) => update('appScale', e.target.value)}
            >
              <option value="90%">Small (90%)</option>
              <option value="100%">Standard (100%)</option>
              <option value="110%">Large (110%)</option>
            </select>
          </div>

        </div>

        <div className="modal-footer" style={{ marginTop: '30px' }}>
          <button type="button" onClick={resetToDefault} style={{ marginRight: 'auto', background: 'var(--border-light)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '12px', fontWeight: '700' }}>
            Restore Default
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
