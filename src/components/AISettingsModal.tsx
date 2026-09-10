'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Key,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Sliders,
  Eye,
  EyeOff,
  Globe,
  Server,
  Layers,
  Zap,
} from 'lucide-react';
import {
  AIMode,
  AIProviderType,
  UniversalAIConfig,
  getUniversalAIConfig,
  saveUniversalAIConfig,
  testUniversalAIConnection,
  AITestResult,
} from '../services/geminiService';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string) => void;
}

// Preset URL & Model populer untuk memudahkan pengguna
const QUICK_PRESETS = [
  {
    name: 'OpenAI (GPT-4o)',
    provider: 'openai-compatible' as AIProviderType,
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    name: 'Groq (Llama 3.3)',
    provider: 'openai-compatible' as AIProviderType,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'DeepSeek',
    provider: 'openai-compatible' as AIProviderType,
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  {
    name: 'OpenRouter (Multi-AI)',
    provider: 'openai-compatible' as AIProviderType,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-001',
  },
  {
    name: 'Ollama (Lokal PC)',
    provider: 'openai-compatible' as AIProviderType,
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
  },
  {
    name: 'Google Gemini',
    provider: 'gemini' as AIProviderType,
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-2.5-flash',
  },
];

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  showToast,
}) => {
  const [mode, setMode] = useState<AIMode>('default');
  const [customProvider, setCustomProvider] = useState<AIProviderType>('openai-compatible');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('https://api.openai.com/v1');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('gpt-4o-mini');
  const [showKeyVisible, setShowKeyVisible] = useState<boolean>(false);

  const [testResult, setTestResult] = useState<AITestResult | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getUniversalAIConfig();
      setMode(cfg.mode);
      setCustomProvider(cfg.customProvider);
      setCustomBaseUrl(cfg.customBaseUrl);
      setCustomApiKey(cfg.customApiKey);
      setCustomModel(cfg.customModel);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setCustomProvider(preset.provider);
    setCustomBaseUrl(preset.baseUrl);
    setCustomModel(preset.model);
    setTestResult(null);
    showToast(`Preset "${preset.name}" diterapkan.`);
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (mode === 'offline') {
        const res = await testUniversalAIConnection({ mode: 'offline' });
        setTestResult(res);
        showToast('Algoritma Sirkadian Lokal siap digunakan secara instan (1 ms) ⚡');
        return;
      }

      const currentConfigToTest: Partial<UniversalAIConfig> = {
        mode,
        customProvider,
        customBaseUrl,
        customApiKey,
        customModel,
      };

      const res = await testUniversalAIConnection(currentConfigToTest);
      setTestResult(res);
      if (res.success) {
        showToast(`AI terhubung & siap digunakan (${res.latencyMs} ms)! ✨`);
      } else {
        showToast('Koneksi AI gagal: ' + res.message);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menghubungi penyedia AI.',
        engineName: mode === 'default' ? 'Gemini Bawaan' : mode === 'offline' ? 'Algoritma Lokal' : customModel,
        mode,
        testedAt: new Date().toISOString(),
      });
      showToast('Gagal menguji koneksi AI.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const newConfig: UniversalAIConfig = {
      mode,
      customProvider,
      customBaseUrl,
      customApiKey,
      customModel,
    };

    saveUniversalAIConfig(newConfig);

    if (mode === 'offline') {
      showToast('Pengaturan disimpan: Mode Offline (Algoritma Sirkadian Lokal) Aktif ⚡');
    } else if (mode === 'default') {
      showToast('Pengaturan disimpan: Menggunakan AI Bawaan Pengembang ✨');
    } else {
      const name = customModel.trim() || 'Custom AI';
      showToast(`Pengaturan disimpan: Menggunakan Custom AI (${name}) ✨`);
    }

    onSaved();
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-container ai-settings-dialog-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header Modal */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div className="modal-header-title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Pengaturan Model AI
              </h3>
              <p className="modal-subtitle" style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Pilih sumber AI bawaan atau hubungkan AI Anda sendiri.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Tutup"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div
          className="ai-settings-dialog-body"
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* 1. Pemilihan Sumber AI (Bawaan vs Custom vs Offline) */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
              Sumber AI / Mode Analisis
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {/* Opsi 1: Bawaan Pengembang */}
              <button
                type="button"
                className={`ai-source-card ${mode === 'default' ? 'active' : ''}`}
                onClick={() => {
                  setMode('default');
                  setTestResult(null);
                }}
                style={{
                  background: mode === 'default' ? '#f0fdf4' : '#ffffff',
                  border: mode === 'default' ? '2px solid #16a34a' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={14} color="#16a34a" />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                    Bawaan
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Cloud AI bawaan siap pakai.
                </p>
                {mode === 'default' && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#16a34a',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      width: 'fit-content',
                    }}
                  >
                    Aktif
                  </span>
                )}
              </button>

              {/* Opsi 2: Kustom AI Sendiri */}
              <button
                type="button"
                className={`ai-source-card ${mode === 'custom' ? 'active' : ''}`}
                onClick={() => {
                  setMode('custom');
                  setTestResult(null);
                }}
                style={{
                  background: mode === 'custom' ? '#f0f9ff' : '#ffffff',
                  border: mode === 'custom' ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Key size={14} color="#0284c7" />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                    Kustom AI
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Bebas dari platform apa pun.
                </p>
                {mode === 'custom' && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#0284c7',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      width: 'fit-content',
                    }}
                  >
                    Aktif
                  </span>
                )}
              </button>

              {/* Opsi 3: Mode Offline (Algoritma Lokal) */}
              <button
                type="button"
                className={`ai-source-card ${mode === 'offline' ? 'active' : ''}`}
                onClick={() => {
                  setMode('offline');
                  setTestResult(null);
                }}
                style={{
                  background: mode === 'offline' ? '#fefce8' : '#ffffff',
                  border: mode === 'offline' ? '2px solid #d97706' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={14} color="#d97706" />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>
                    Offline
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0 0', lineHeight: 1.3 }}>
                  Algoritma lokal. Super instan & hemat.
                </p>
                {mode === 'offline' && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '9px',
                      fontWeight: 700,
                      background: '#d97706',
                      color: '#ffffff',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      width: 'fit-content',
                    }}
                  >
                    Aktif
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Jika Mode Bawaan Pengembang: Tidak ada pilihan model membingungkan */}
          {mode === 'default' && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '11px 13px',
                fontSize: '11.5px',
                color: '#475569',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} color="#16a34a" />
                Mode Otomatis Siap Pakai
              </div>
              Menggunakan model cerdas yang disediakan pengembang secara default. Anda tidak perlu repot memilih model atau memasukkan kunci.
            </div>
          )}

          {/* Jika Mode Offline (Algoritma Lokal) Dipilih */}
          {mode === 'offline' && (
            <div
              style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '10px',
                padding: '11px 13px',
                fontSize: '11.5px',
                color: '#78350f',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="#d97706" />
                Mode Offline (Algoritma Sirkadian Lokal) Aktif
              </div>
              Bagi Anda yang tidak ingin menggunakan AI atau ingin menghemat kuota internet, seluruh analisis tugas dijalankan langsung oleh mesin Algoritma Sirkadian Biologis di perangkat secara <strong>instan (&lt;1 detik) tanpa internet dan tanpa kuota</strong>.
            </div>
          )}

          {/* Jika Mode Kustom Sendiri: Pengguna bebas mengisi platform apa pun */}
          {mode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Preset Cepat */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block' }}>
                  ⚡ Preset Cepat Platform:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {QUICK_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '10.5px',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format / Tipe API */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>
                  <Globe size={12} /> Format / Tipe API
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: customProvider === 'openai-compatible' ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: customProvider === 'openai-compatible' ? '#f0f9ff' : '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="customProvider"
                      checked={customProvider === 'openai-compatible'}
                      onChange={() => setCustomProvider('openai-compatible')}
                    />
                    <span>OpenAI Compatible</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: customProvider === 'gemini' ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: customProvider === 'gemini' ? '#f0f9ff' : '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="customProvider"
                      checked={customProvider === 'gemini'}
                      onChange={() => setCustomProvider('gemini')}
                    />
                    <span>Google Gemini</span>
                  </label>
                </div>
              </div>

              {/* Base URL / Endpoint (Khusus OpenAI-compatible) */}
              {customProvider === 'openai-compatible' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="custom-base-url" style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>
                    <Server size={12} /> Base URL / Endpoint API
                  </label>
                  <input
                    id="custom-base-url"
                    type="text"
                    className="form-input"
                    placeholder="https://api.openai.com/v1"
                    value={customBaseUrl}
                    onChange={(e) => {
                      setCustomBaseUrl(e.target.value);
                      setTestResult(null);
                    }}
                    style={{ fontSize: '12px', padding: '7px 10px' }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                    Mendukung OpenAI, DeepSeek, Groq, OpenRouter, Mistral, Ollama (localhost), dll.
                  </span>
                </div>
              )}

              {/* Nama Model AI */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="custom-model-name" style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>
                  <Cpu size={12} /> Nama Model AI
                </label>
                <input
                  id="custom-model-name"
                  type="text"
                  className="form-input"
                  placeholder={customProvider === 'gemini' ? 'gemini-2.5-flash' : 'Contoh: gpt-4o-mini, deepseek-chat, llama-3.3-70b'}
                  value={customModel}
                  onChange={(e) => {
                    setCustomModel(e.target.value);
                    setTestResult(null);
                  }}
                  style={{ fontSize: '12px', padding: '7px 10px' }}
                />
              </div>

              {/* API Key */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="custom-api-key" style={{ fontSize: '11.5px', fontWeight: 600, color: '#1e293b' }}>
                  <Key size={12} /> API Key Anda
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    id="custom-api-key"
                    type={showKeyVisible ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Masukkan API Key Anda..."
                    value={customApiKey}
                    onChange={(e) => {
                      setCustomApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    style={{ fontSize: '12px', padding: '7px 36px 7px 10px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyVisible(!showKeyVisible)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title={showKeyVisible ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                  Kunci Anda tersimpan aman secara lokal di browser Anda.
                </span>
              </div>
            </div>
          )}

          {/* Kotak Pemberitahuan Algoritma Lokal (Instruksi Pengguna) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '9px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <Info size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '11px', color: '#78350f', lineHeight: 1.45 }}>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>
                Jaminan Berjalan Offline & Mandiri:
              </strong>
              Bila perangkat tidak memiliki internet, API key tidak terhubung, atau kuota habis, aplikasi akan <strong>secara otomatis menjalankan Algoritma Sirkadian Lokal</strong> sehingga seluruh analisis tugas tetap berfungsi 100%.
            </div>
          </div>

          {/* Bagian Uji Respon Koneksi */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                Uji Respon Koneksi AI
              </span>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isTesting ? (
                  <>
                    <Loader2 size={12} className="spin" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <Wifi size={12} />
                    <span>Cek Koneksi AI</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  background: testResult.success ? '#ecfdf5' : '#fef2f2',
                  border: testResult.success ? '1px solid #a7f3d0' : '1px solid #fecaca',
                  color: testResult.success ? '#065f46' : '#991b1b',
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
                ) : (
                  <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                )}
                <div>
                  <strong style={{ display: 'block' }}>
                    {testResult.success ? 'AI Berfungsi & Terhubung' : 'Koneksi Belum Berhasil'}
                  </strong>
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#f1f5f9',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#0284c7',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
