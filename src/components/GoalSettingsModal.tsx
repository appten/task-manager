'use client';

import React, { useState, useEffect } from 'react';
import { Target, X, Check, Sparkles, HelpCircle, ArrowUpRight, Minus, ArrowDownRight, Key, Eye, EyeOff } from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { getGeminiApiKey, setGeminiApiKey } from '../services/geminiService';

export const GoalSettingsModal: React.FC = () => {
  const { userGoal, saveUserGoal, isGoalModalOpen, setIsGoalModalOpen } = useTask();
  const [goalInput, setGoalInput] = useState(userGoal);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isGoalModalOpen) {
      setGoalInput(userGoal);
      setApiKeyInput(getGeminiApiKey());
    }
  }, [isGoalModalOpen, userGoal]);

  if (!isGoalModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    saveUserGoal(goalInput);
    setGeminiApiKey(apiKeyInput);
    setIsGoalModalOpen(false);
  };

  const sampleGoals = [
    'Merilis produk digital berdampak, menjaga kesehatan prima, dan mandiri finansial di 2026',
    'Menyelesaikan skripsi tepat waktu, lulus predikat cumlaude, dan memulai karir AI Engineer',
    'Membangun bisnis agensi digital, mencapai 10 klien aktif, dan hidup seimbang',
  ];

  return (
    <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
      <div
        className="modal-sheet goal-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle-bar" />
        <div className="sheet-header">
          <div className="goal-header-title">
            <div className="goal-icon-badge">
              <Target size={20} />
            </div>
            <div>
              <div className="sheet-title">Goals & Tujuan Hidup</div>
              <p className="modal-subtitle">Personalisasi Konteks Analisis AI</p>
            </div>
          </div>
          <button
            type="button"
            className="android-icon-btn close-btn"
            onClick={() => setIsGoalModalOpen(false)}
            title="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="form-container">
          <div className="goal-info-card">
            <div className="goal-info-title">
              <Sparkles size={16} />
              <span>Bagaimana AI Menilai Tugas Anda?</span>
            </div>
            <p className="goal-info-text">
              Setiap tugas akan dianalisis Gemini AI terhadap goals di bawah ini dan diberi skor <strong>-100 hingga +100</strong>:
            </p>
            <div className="score-legend-grid">
              <div className="legend-item legend-pos">
                <span className="legend-badge"><ArrowUpRight size={13} /> +1 s/d +100</span>
                <span className="legend-desc">Mendekatkan ke goal</span>
              </div>
              <div className="legend-item legend-neu">
                <span className="legend-badge"><Minus size={13} /> 0</span>
                <span className="legend-desc">Netral / rutinitas</span>
              </div>
              <div className="legend-item legend-neg">
                <span className="legend-badge"><ArrowDownRight size={13} /> -1 s/d -100</span>
                <span className="legend-desc">Menjauhkan / distraksi</span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label htmlFor="user-goal-input">
              Tujuan Besar Anda Tahun Ini (Goals 2026)
            </label>
            <textarea
              id="user-goal-input"
              rows={3}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Contoh: Merilis aplikasi baru, hidup sehat bugar, dan mencapai kebebasan finansial..."
              className="form-textarea goal-textarea"
              autoFocus
              required
            />
            <span className="form-help">
              Tuliskan target spesifik agar AI dapat mengevaluasi tugas secara akurat.
            </span>
          </div>

          <div className="preset-goals-container">
            <div className="preset-label">
              <HelpCircle size={13} />
              <span>Inspirasi Cepat:</span>
            </div>
            <div className="preset-tags">
              {sampleGoals.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-tag-btn"
                  onClick={() => setGoalInput(sample)}
                >
                  {sample.length > 45 ? `${sample.slice(0, 45)}...` : sample}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label htmlFor="gemini-api-key-input" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                <Key size={15} style={{ color: '#0284c7' }} />
                <span>Gemini API Key</span>
              </label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showApiKey ? 'Sembunyikan' : 'Lihat'}</span>
              </button>
            </div>
            <input
              id="gemini-api-key-input"
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Masukkan Gemini API Key..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'monospace',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block', lineHeight: 1.4 }}>
              Disimpan aman di browser Anda (localStorage). Dapat dipakai langsung tanpa build ulang Cloudflare.
            </span>
          </div>

          <div className="form-actions-dual" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onClick={() => setIsGoalModalOpen(false)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{
                flex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
              disabled={!goalInput.trim()}
            >
              <Check size={18} />
              <span>Simpan Goals</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
