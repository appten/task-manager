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
  Trash2,
  X,
  Smartphone,
  Check,
  Info,
  ChevronRight,
  MessageSquarePlus,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { VersionHistoryView } from './VersionHistoryView';
import { FeedbackModal } from './FeedbackModal';
import { APP_CURRENT_VERSION } from '../data/versionHistory';

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
    clearAllTasksAndStartFresh,
    showToast,
  } = useTask();

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Danger Zone Reset state (2-step confirmation with phrase)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA';

  const handleOpenResetModal = () => {
    setResetStep(1);
    setConfirmText('');
    setIsResetModalOpen(true);
  };

  const handleCloseResetModal = () => {
    setIsResetModalOpen(false);
    setResetStep(1);
    setConfirmText('');
  };

  const handleExecuteResetAll = () => {
    if (confirmText.trim() !== CONFIRMATION_PHRASE) return;
    clearAllTasksAndStartFresh();
    handleCloseResetModal();
    showToast('Seluruh data aplikasi berhasil direset bersih.');
  };
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

  const handleLogout = () => {
    if (window.confirm('Keluar dari akun ini? Data tugas di perangkat ini tetap aman tersimpan.')) {
      logoutUser();
    }
  };

  if (showVersionHistory) {
    return <VersionHistoryView onBack={() => setShowVersionHistory(false)} />;
  }

  return (
    <div className="account-view-container">
      {/* 1. Profil Pengguna Ringkas & Bersih */}
      <div className="account-clean-header">
        <div className={`account-avatar-circle ${currentUser ? 'logged-in' : 'guest'}`}>
          {currentUser ? (
            <span className="avatar-initial">{currentUser.name.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={30} />
          )}
        </div>

        <div className="account-profile-info">
          <h2 className="account-user-name">{currentUser ? currentUser.name : 'Pengguna Tamu'}</h2>
          <span className="account-email">
            {currentUser ? currentUser.email : 'Mode Offline • Data tersimpan di perangkat ini'}
          </span>
          <div className="account-badges-row">
            <div className={`account-status-badge ${currentUser ? 'cloud-active' : 'guest'}`}>
              <span className={`status-dot ${currentUser ? 'pulsing-green' : 'gray'}`}></span>
              <span>{currentUser ? 'Akun Tersambung' : 'Lokal (Offline)'}</span>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Masuk / Daftar / Keluar */}
        <div className="account-clean-actions">
          {currentUser ? (
            <button
              type="button"
              className="btn-account-logout"
              onClick={handleLogout}
              title="Keluar dari akun"
            >
              <LogOut size={13} />
              <span>Keluar</span>
            </button>
          ) : (
            <div className="guest-action-buttons">
              <button
                type="button"
                className="account-btn-primary"
                onClick={() => handleOpenAuth('login')}
              >
                <LogIn size={13} />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                className="account-btn-outline"
                onClick={() => handleOpenAuth('register')}
              >
                <UserPlus size={13} />
                <span>Daftar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Ringkasan Produktivitas (3 Angka Fungsional) */}
      <div className="account-stats-grid">
        <div className="account-stat-box">
          <span className="stat-number">{totalTasks}</span>
          <span className="stat-label">Total Tugas</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{todayTasks.length}</span>
          <span className="stat-label">Fokus Today</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{completedTasks}</span>
          <span className="stat-label">Selesai</span>
        </div>
      </div>

      {/* 3. Kartu Pencadangan & Sinkronisasi Ringkas */}
      <div className="account-sync-card">
        <div className="sync-card-header">
          <div className="sync-icon-box">
            <Cloud size={18} className={currentUser ? 'text-primary' : 'text-muted'} />
          </div>
          <div className="sync-header-content">
            <div className="sync-title-row">
              <h3 className="sync-title">Pencadangan Cloud</h3>
              <span className={`sync-pill ${currentUser ? 'active' : 'optional'}`}>
                {currentUser ? 'Aktif' : 'Tersedia'}
              </span>
            </div>
            <div className="sync-status-text">
              {currentUser
                ? `Terakhir disinkronkan: ${formatLastSync(lastCloudSyncedAt)}`
                : 'Cadangkan tugas Anda agar tetap aman dan dapat diakses saat berganti perangkat.'}
            </div>
          </div>
        </div>

        <div className="sync-card-body">
          {currentUser ? (
            <div className="sync-controls-row">
              <button
                type="button"
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
            <button
              type="button"
              className="btn-enable-cloud"
              onClick={() => handleOpenAuth('register')}
            >
              <Cloud size={14} />
              <span>Aktifkan Pencadangan Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Informasi & Versi Aplikasi */}
      <div className="account-info-box">
        <div className="info-box-row">
          <span className="info-box-label">Status Data</span>
          <span className="info-box-val text-green">
            <CheckCircle2 size={13} /> {currentUser ? 'Tersinkron Cloud' : 'Tersimpan di Perangkat Ini'}
          </span>
        </div>
        <button
          type="button"
          className="info-box-row info-box-row-clickable"
          onClick={() => setShowVersionHistory(true)}
          aria-label="Buka riwayat versi aplikasi"
        >
          <span className="info-box-label">Versi Aplikasi</span>
          <span className="info-box-val font-semibold text-primary clickable-version">
            {APP_CURRENT_VERSION}
            <ChevronRight size={14} className="version-chevron" />
          </span>
        </button>
        <button
          type="button"
          className="info-box-row info-box-row-clickable"
          onClick={() => setIsFeedbackModalOpen(true)}
          aria-label="Kirim masukan atau saran aplikasi"
        >
          <span className="info-box-label">Kirim Masukan (Feedback)</span>
          <span className="info-box-val font-semibold text-primary clickable-version">
            Beri Saran & Lapor Bug
            <ChevronRight size={14} className="version-chevron" />
          </span>
        </button>
      </div>

      {/* 5. Zona Bahaya: Reset Seluruh Data */}
      <div className="account-danger-card">
        <div className="danger-card-top">
          <div className="danger-card-icon-wrap">
            <AlertTriangle size={16} />
          </div>
          <div className="danger-card-info">
            <h4 className="danger-card-title">Zona Bahaya</h4>
            <p className="danger-card-desc">
              Hapus seluruh data tugas, riwayat, sasaran, dan hasil AI dari perangkat ini secara permanen.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-danger-reset-trigger"
          onClick={handleOpenResetModal}
        >
          <Trash2 size={13} />
          <span>Reset Semua Data</span>
        </button>
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

      {/* Modal Konfirmasi Bahaya Reset Data (2 Tahap) */}
      {isResetModalOpen && (
        <div className="danger-modal-overlay" onClick={handleCloseResetModal}>
          <div className="danger-reset-card" onClick={(e) => e.stopPropagation()}>
            <div className="danger-modal-header">
              <div className="danger-modal-title-group">
                <div className="danger-badge-icon">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="danger-modal-title">
                    {resetStep === 1
                      ? 'Peringatan Reset Data (1/2)'
                      : 'Konfirmasi Terakhir (2/2)'}
                  </h3>
                  <span className="danger-step-subtitle">
                    {resetStep === 1
                      ? 'Tindakan ini permanen & tidak dapat dibatalkan'
                      : `Ketik "${CONFIRMATION_PHRASE}" untuk menyetujui`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="danger-close-btn"
                onClick={handleCloseResetModal}
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>

            {resetStep === 1 ? (
              <div className="danger-modal-body">
                <div className="danger-alert-callout">
                  <p className="danger-callout-main">
                    Apakah Anda benar-benar yakin ingin menghapus seluruh data?
                  </p>
                  <p className="danger-callout-sub">
                    Semua daftar tugas di Inbox & Today, seluruh riwayat penyelesaian, sasaran hidup tahunan, serta cache hasil analisis AI akan dihapus bersih seketika dari browser ini.
                  </p>
                </div>

                <div className="danger-modal-footer">
                  <button
                    type="button"
                    className="btn-danger-cancel"
                    onClick={handleCloseResetModal}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn-proceed-danger"
                    onClick={() => setResetStep(2)}
                  >
                    <span>Lanjut ke Konfirmasi Akhir</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="danger-modal-body">
                <p className="danger-confirm-instruction">
                  Sebagai langkah pengamanan ganda, silakan ketik kalimat konfirmasi berikut dengan huruf kapital persis:
                </p>

                <div className="danger-target-phrase-box">
                  <code>{CONFIRMATION_PHRASE}</code>
                </div>

                <div className="danger-input-wrap">
                  <input
                    type="text"
                    className="danger-confirm-input"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Ketik "${CONFIRMATION_PHRASE}" di sini...`}
                    autoFocus
                  />
                </div>

                <div className="danger-modal-footer">
                  <button
                    type="button"
                    className="btn-danger-cancel"
                    onClick={() => setResetStep(1)}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    className="btn-execute-danger"
                    disabled={confirmText.trim() !== CONFIRMATION_PHRASE}
                    onClick={handleExecuteResetAll}
                  >
                    <Trash2 size={14} />
                    <span>Hapus Permanen Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Kirim Masukan (Feedback) */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
