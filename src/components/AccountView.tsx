'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  AlertTriangle,
  X,
  Smartphone,
  Check,
  Info,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';

export const AccountView: React.FC = () => {
  const {
    tasks,
    todayTasks,
    currentUser,
    isSyncingCloud,
    lastCloudSyncedAt,
    isAutoSyncEnabled,
    loginUser,
    registerUser,
    logoutUser,
    triggerCloudSync,
    toggleAutoSync,
  } = useTask();

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [mergeLocalData, setMergeLocalData] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthError(null);
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setMergeLocalData(true);
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Email dan kata sandi wajib diisi');
      return;
    }

    if (authMode === 'register' && !nameInput.trim()) {
      setAuthError('Nama lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        const res = await registerUser(nameInput.trim(), emailInput.trim(), passwordInput, mergeLocalData);
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          setAuthError(res.error || 'Gagal mendaftar akun');
        }
      } else {
        const res = await loginUser(emailInput.trim(), passwordInput, mergeLocalData);
        if (res.success) {
          setIsAuthModalOpen(false);
        } else {
          setAuthError(res.error || 'Email atau kata sandi salah');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kendala saat menghubungkan akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Tersimpan lokal di browser';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="account-view-container">
      {/* 1. Header Profil & Status Akun */}
      <div className="account-header">
        <div className={`account-avatar-circle ${currentUser ? 'logged-in' : 'guest'}`}>
          {currentUser ? (
            <span className="avatar-initial">{currentUser.name.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={34} />
          )}
        </div>
        <h2 className="account-user-name">{currentUser ? currentUser.name : 'Tamu (Guest)'}</h2>
        <span className="account-email">
          {currentUser ? currentUser.email : 'Mode Offline — Data tersimpan di perangkat ini'}
        </span>

        <div className="account-badges-row">
          <div className={`account-status-badge ${currentUser ? 'cloud-active' : 'guest'}`}>
            <span className={`status-dot ${currentUser ? 'pulsing-green' : 'green'}`}></span>
            <span>{currentUser ? 'Sinkronisasi Cloud Aktif' : 'Tersimpan di Perangkat (Lokal)'}</span>
          </div>
        </div>

        {/* Tombol Aksi Masuk / Keluar (Keluar dinonaktifkan sementara demi keamanan) */}
        <div className="account-header-actions">
          {currentUser ? (
            <div className="account-logout-locked-box">
              <button
                className="account-btn-secondary disabled-locked"
                disabled
                title="Fitur keluar akun dinonaktifkan sementara demi menjaga keamanan data"
              >
                <Lock size={13} />
                <span>Sesi Akun Aktif (Terkunci Aman)</span>
              </button>
              <p className="account-locked-hint">
                Fitur keluar akun dinonaktifkan sementara agar datamu tidak hilang karena fitur pemulihan akun (lupa sandi) masih dalam pengembangan.
              </p>
            </div>
          ) : (
            <div className="guest-action-buttons">
              <button
                className="account-btn-primary"
                onClick={() => handleOpenAuth('login')}
              >
                <LogIn size={14} />
                <span>Masuk Akun</span>
              </button>
              <button
                className="account-btn-outline"
                onClick={() => handleOpenAuth('register')}
              >
                <UserPlus size={14} />
                <span>Daftar Akun Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Kartu Pencadangan & Sinkronisasi Data (Cloud Backup) */}
      <div className="account-sync-card">
        <div className="sync-card-header">
          <div className="sync-icon-box">
            <Cloud size={20} className={currentUser ? 'text-primary' : 'text-muted'} />
          </div>
          <div className="sync-header-content">
            <div className="sync-title-row">
              <h3 className="sync-title">Pencadangan & Sinkronisasi</h3>
              <span className={`sync-pill ${currentUser ? 'active' : 'optional'}`}>
                {currentUser ? 'Aktif' : 'Opsional'}
              </span>
            </div>
            <p className="sync-desc">
              {currentUser
                ? 'Catatan tugasmu dicadangkan secara aman. Kamu bisa membukanya dari HP, tablet, atau browser lain tanpa khawatir hilang.'
                : 'Aplikasi ini 100% bebas dipakai tanpa akun. Ingin tugasmu aman saat berganti perangkat? Kamu bisa mengaktifkan pencadangan kapan saja.'}
            </p>
          </div>
        </div>

        <div className="sync-card-body">
          <div className="sync-status-row">
            <span className="sync-status-label">Status Sinkronisasi:</span>
            <span className="sync-status-val">
              {currentUser ? `Terakhir: ${formatLastSync(lastCloudSyncedAt)}` : 'Hanya di perangkat ini (Offline)'}
            </span>
          </div>

          {currentUser ? (
            <div className="sync-controls-row">
              <button
                className="btn-sync-now"
                onClick={() => triggerCloudSync()}
                disabled={isSyncingCloud}
              >
                <RefreshCw size={13} className={isSyncingCloud ? 'spin-animation' : ''} />
                <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>

              <label className="auto-sync-switch">
                <input
                  type="checkbox"
                  checked={isAutoSyncEnabled}
                  onChange={toggleAutoSync}
                />
                <span className="switch-slider"></span>
                <span className="switch-label">Simpan Otomatis</span>
              </label>
            </div>
          ) : (
            <div className="guest-sync-promo">
              <div className="promo-text">
                <strong>Simpan tugasmu agar selalu aman</strong>
                <p>Saat mendaftar, {totalTasks} tugas lokal yang ada saat ini bisa otomatis disatukan ke akun barumu.</p>
              </div>
              <button
                className="btn-promo-register"
                onClick={() => handleOpenAuth('register')}
              >
                <UserPlus size={14} />
                <span>Aktifkan Cadangan Cloud</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Kartu Privasi & Fitur Cerdas (AI Transparency) */}
      <div className="account-transparency-card">
        <div className="transparency-icon-circle">
          <Sparkles size={20} className="text-ai-purple" />
        </div>
        <div className="transparency-content">
          <div className="transparency-header">
            <h3 className="transparency-title">Privasi & Fitur Cerdas</h3>
            <span className="ai-provider-badge">Google Gemini</span>
          </div>
          <p className="transparency-desc">
            Aplikasi ini menjaga privasimu dengan prinsip keterbukaan:
          </p>
          <div className="transparency-bullets">
            <div className="transparency-bullet-item">
              <Shield size={14} className="text-ai-purple flex-shrink-0" />
              <span>
                <strong>Pemrosesan AI:</strong> Fitur saran jadwal dan pembongkaran tugas diproses melalui <strong>Google Gemini</strong> hanya saat kamu menekan tombol analisis.
              </span>
            </div>
            <div className="transparency-bullet-item">
              <Eye size={14} className="text-ai-purple flex-shrink-0" />
              <span>
                <strong>Tanpa Pelacakan Pribadi:</strong> Data tidak dikirim diam-diam di latar belakang. Privasi dan kendali tetap ada di tanganmu.
              </span>
            </div>
            <div className="transparency-bullet-item">
              <Smartphone size={14} className="text-ai-purple flex-shrink-0" />
              <span>
                <strong>Bebas Dipakai Offline:</strong> Seluruh pencatat tugas, timer hitung mundur, dan kalender tetap berfungsi penuh 100% tanpa perlu menyentuh AI.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Ringkasan Aktivitasmu */}
      <div className="account-stats-grid">
        <div className="account-stat-box">
          <span className="stat-number">{totalTasks}</span>
          <span className="stat-label">Total Tugas</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{todayTasks.length}</span>
          <span className="stat-label">Fokus Hari Ini</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{completedTasks}</span>
          <span className="stat-label">Selesai</span>
        </div>
      </div>

      {/* 5. Informasi Aplikasi Ringkas */}
      <div className="account-info-box">
        <div className="info-box-row">
          <span className="info-box-label">Status Penyimpanan</span>
          <span className="info-box-val text-green">
            <CheckCircle2 size={12} /> {currentUser ? 'Tersinkron Cloud' : 'Lokal Perangkat (Offline)'}
          </span>
        </div>
        <div className="info-box-row">
          <span className="info-box-label">Versi Aplikasi</span>
          <span className="info-box-val font-semibold text-primary">v1.1.0</span>
        </div>
      </div>

      {/* 6. Modal Masuk / Daftar Akun */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Cloud size={19} className="text-primary" />
                <h3 className="modal-title">
                  {authMode === 'register' ? 'Buat Akun Cadangan' : 'Masuk ke Akun'}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-tab-switch">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
              >
                <LogIn size={14} />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
              >
                <UserPlus size={14} />
                <span>Daftar Baru</span>
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authError && (
                <div className="auth-error-banner">
                  <AlertTriangle size={14} />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">
                    <User size={13} />
                    <span>Nama Kamu</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Budi"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <Mail size={13} />
                  <span>Alamat Email</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} />
                  <span>Kata Sandi</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>

              {/* Catatan Keamanan & Kesadaran Akun (Awareness) */}
              {authMode === 'register' ? (
                <div className="auth-security-notice">
                  <Info size={16} className="text-amber flex-shrink-0" />
                  <div className="notice-text">
                    <strong>Catatan Penting Keamanan:</strong>
                    <p>
                      Pastikan kamu mengingat email & kata sandi dengan baik. Karena fitur lupa akun (reset sandi) masih dalam pengembangan, setelah berhasil mendaftar fitur keluar akun akan dinonaktifkan sementara demi menjaga datamu tidak hilang.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="auth-security-notice info-blue">
                  <Info size={14} className="text-blue flex-shrink-0" />
                  <div className="notice-text">
                    <p>
                      Setelah masuk, sesi akunmu akan tetap aktif tersimpan di perangkat ini demi menjaga integritas data.
                    </p>
                  </div>
                </div>
              )}

              {/* Opsi Penyatuan Data Lokal */}
              <div className="data-merge-option-box">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={mergeLocalData}
                    onChange={(e) => setMergeLocalData(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-text">
                    <strong>Satukan {totalTasks} tugas lokal saat ini</strong>
                    <p className="text-xs text-muted">
                      Tugas yang sudah kamu buat di perangkat ini tetap aman dan otomatis tersimpan ke akunmu.
                    </p>
                  </div>
                </label>
              </div>

              <div className="auth-form-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAuthModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-submit-auth"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>Memproses...</span>
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <UserPlus size={14} />
                      <span>Daftar & Hubungkan</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={14} />
                      <span>Masuk Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
