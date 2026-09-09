'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  EyeOff,
  KeyRound,
  Settings,
  AlertTriangle,
  Trash2,
  X,
  Smartphone,
  Check,
  Info,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
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
    verifyRecoveryPin,
    resetPasswordUser,
    updateUserProfile,
    clearAllTasksAndStartFresh,
    showToast,
  } = useTask();

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutClearLocal, setLogoutClearLocal] = useState(false);

  // Danger Zone Reset state (2-step confirmation with phrase)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA';

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [recoveryPinInput, setRecoveryPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mergeLocalData, setMergeLocalData] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');

  // Profile update states
  const [editNameInput, setEditNameInput] = useState('');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editRecoveryPin, setEditRecoveryPin] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const handleOpenAuth = (mode: 'login' | 'register' | 'forgot') => {
    setAuthMode(mode);
    setAuthError(null);
    setAuthSuccessMsg(null);
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setRecoveryPinInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');
    setForgotStep(1);
    setShowPassword(false);
    setMergeLocalData(true);
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (authMode === 'forgot') {
      await handleForgotSubmit();
      return;
    }

    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Email dan kata sandi wajib diisi');
      return;
    }

    if (authMode === 'register' && !nameInput.trim()) {
      setAuthError('Nama lengkap wajib diisi');
      return;
    }

    if (authMode === 'register' && recoveryPinInput && recoveryPinInput.length < 4) {
      setAuthError('PIN Pemulihan minimal 4 digit (disarankan 6 angka)');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'register') {
        const res = await registerUser(
          nameInput.trim(),
          emailInput.trim(),
          passwordInput,
          mergeLocalData,
          recoveryPinInput.trim()
        );
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
          setAuthError(res.error || 'Email atau kata sandi tidak sesuai');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Terjadi kendala saat menghubungkan akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Lupa Kata Sandi (2-Tahap)
  const handleForgotSubmit = async () => {
    if (forgotStep === 1) {
      if (!emailInput.trim() || !recoveryPinInput.trim()) {
        setAuthError('Email dan PIN Pemulihan wajib diisi');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await verifyRecoveryPin(emailInput.trim(), recoveryPinInput.trim());
        if (res.success) {
          setForgotStep(2);
          setAuthError(null);
          setAuthSuccessMsg(`Identitas terverifikasi (${res.name || 'Pengguna'}). Silakan masukkan kata sandi baru.`);
        } else {
          setAuthError(res.error || 'Verifikasi gagal. Periksa email atau PIN.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Gagal memverifikasi pemulihan');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!newPasswordInput || newPasswordInput.length < 6) {
        setAuthError('Kata sandi baru minimal 6 karakter');
        return;
      }
      if (newPasswordInput !== confirmNewPasswordInput) {
        setAuthError('Konfirmasi kata sandi tidak cocok');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await resetPasswordUser(emailInput.trim(), recoveryPinInput.trim(), newPasswordInput);
        if (res.success) {
          setAuthSuccessMsg('Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.');
          setTimeout(() => {
            setAuthMode('login');
            setPasswordInput('');
            setForgotStep(1);
          }, 1500);
        } else {
          setAuthError(res.error || 'Gagal mengatur ulang kata sandi');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Terjadi kesalahan saat reset sandi');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handler Buka Edit Profil
  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setEditNameInput(currentUser.name);
    setEditOldPassword('');
    setEditNewPassword('');
    setEditRecoveryPin('');
    setProfileMsg(null);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (editNewPassword && editNewPassword.length < 6) {
      setProfileMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter' });
      return;
    }

    if (editNewPassword && !editOldPassword) {
      setProfileMsg({ type: 'error', text: 'Masukkan kata sandi saat ini untuk verifikasi penggantian sandi' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateUserProfile(
        editNameInput.trim() || undefined,
        editOldPassword || undefined,
        editNewPassword || undefined,
        editRecoveryPin.trim() || undefined
      );

      if (res.success) {
        setProfileMsg({ type: 'success', text: 'Profil dan pengaturan berhasil diperbarui!' });
        setTimeout(() => {
          setIsProfileModalOpen(false);
        }, 1200);
      } else {
        setProfileMsg({ type: 'error', text: res.error || 'Gagal memperbarui profil' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Terjadi kendala' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Konfirmasi Logout
  const handleConfirmLogout = () => {
    logoutUser(logoutClearLocal);
    setIsLogoutModalOpen(false);
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Belum disinkronkan';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      );
    } catch {
      return dateStr;
    }
  };

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

  if (showVersionHistory) {
    return <VersionHistoryView onBack={() => setShowVersionHistory(false)} />;
  }

  return (
    <div className="account-view-container">
      {/* 1. Header Profil Pengguna */}
      <div className="account-clean-header">
        <div className={`account-avatar-circle ${currentUser ? 'logged-in' : 'guest'}`}>
          {currentUser ? (
            <span className="avatar-initial">{currentUser.name.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={30} />
          )}
        </div>

        <div className="account-profile-info">
          <div className="account-profile-top-line">
            <h2 className="account-user-name">{currentUser ? currentUser.name : 'Pengguna Tamu'}</h2>
            {currentUser && (
              <button
                type="button"
                className="btn-edit-profile-icon"
                onClick={handleOpenProfileModal}
                title="Pengaturan akun & sandi"
              >
                <Settings size={14} />
              </button>
            )}
          </div>
          <span className="account-email">
            {currentUser ? currentUser.email : 'Mode Offline • Data tersimpan di perangkat ini'}
          </span>
          <div className="account-badges-row">
            <div className={`account-status-badge ${currentUser ? 'cloud-active' : 'guest'}`}>
              <span className={`status-dot ${currentUser ? 'pulsing-green' : 'gray'}`}></span>
              <span>{currentUser ? 'Akun Tersambung (Cloud)' : 'Mode Tamu (Lokal)'}</span>
            </div>
            {currentUser && (
              <div
                className={`account-status-badge ${currentUser.role === 'admin' ? 'admin-role-badge' : 'user-role-badge'}`}
                title={`Role akun: ${currentUser.role === 'admin' ? 'Pengelola' : 'User'}`}
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <ShieldCheck size={11} className="text-primary" />
                    <span className="font-semibold text-primary">Pengelola</span>
                  </>
                ) : (
                  <>
                    <User size={11} className="text-muted" />
                    <span>User</span>
                  </>
                )}
              </div>
            )}
            {currentUser?.recoveryPinSet && (
              <div className="account-status-badge recovery-ready" title="PIN Pemulihan aktif">
                <ShieldCheck size={11} className="text-primary" />
                <span>PIN Siap</span>
              </div>
            )}
          </div>
        </div>

        {/* Tombol Aksi Masuk / Daftar / Keluar */}
        <div className="account-clean-actions">
          {currentUser ? (
            <button
              type="button"
              className="btn-account-logout"
              onClick={() => {
                setLogoutClearLocal(false);
                setIsLogoutModalOpen(true);
              }}
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

      {/* 2. Edukasi Komparasi Mode Tamu vs Akun Cloud (Hanya muncul jika belum login) */}
      {!currentUser && (
        <div className="cloud-benefits-banner">
          <div className="cloud-benefits-top">
            <div className="cloud-benefits-icon-wrap">
              <Cloud size={17} className="text-primary" />
            </div>
            <div>
              <h4 className="cloud-benefits-title">Simpan Tugas di Cloud & Sinkron Multi-Device</h4>
              <p className="cloud-benefits-subtitle">
                Aplikasi tetap bisa digunakan 100% tanpa akun. Namun dengan membuat akun:
              </p>
            </div>
          </div>
          <div className="cloud-benefits-grid">
            <div className="benefit-item">
              <Smartphone size={13} className="text-blue flex-shrink-0" />
              <span>Login di HP maupun Laptop, tugas otomatis sinkron</span>
            </div>
            <div className="benefit-item">
              <ShieldCheck size={13} className="text-blue flex-shrink-0" />
              <span>Tugas & sasaran aman tersimpan meski ganti HP</span>
            </div>
            <div className="benefit-item">
              <KeyRound size={13} className="text-blue flex-shrink-0" />
              <span>Dilengkapi PIN pemulihan mandiri jika lupa kata sandi</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ringkasan Produktivitas (3 Angka Fungsional) */}
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

      {/* 4. Kartu Pencadangan & Sinkronisasi Cloud */}
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
                : 'Cadangkan tugas Anda agar tetap aman dan dapat diakses saat membuka di perangkat lain.'}
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
              <span>Aktifkan Akun & Pencadangan Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Informasi & Versi Aplikasi */}
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
        <Link
          href="/pengelola"
          className="info-box-row info-box-row-clickable pengelola-access-row"
          aria-label="Buka panel pengelola dan statistik aplikasi"
        >
          <span className="info-box-label flex-row-align">
            <Shield size={13} className="text-primary" />
            <span className="font-semibold text-primary">Panel Pengelola & Statistik</span>
          </span>
          <span className="info-box-val font-semibold text-primary clickable-version">
            {currentUser?.role === 'admin' ? 'Akses Pengelola' : 'Buka Dashboard'}
            <ChevronRight size={14} className="version-chevron" />
          </span>
        </Link>
      </div>

      {/* 6. Zona Bahaya: Reset Seluruh Data */}
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

      {/* =========================================================================
          MODAL 1: AUTH (LOGIN, REGISTER, LUPA KATA SANDI)
          ========================================================================= */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Cloud size={19} className="text-primary" />
                <h3 className="modal-title">
                  {authMode === 'register'
                    ? 'Buat Akun Cloud'
                    : authMode === 'forgot'
                    ? 'Pemulihan Kata Sandi'
                    : 'Masuk ke Akun'}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAuthModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab switch hanya saat bukan mode forgot */}
            {authMode !== 'forgot' ? (
              <div className="auth-tab-switch">
                <button
                  type="button"
                  className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
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
                    setAuthSuccessMsg(null);
                  }}
                >
                  <UserPlus size={14} />
                  <span>Daftar Baru</span>
                </button>
              </div>
            ) : (
              <div className="forgot-back-bar">
                <button
                  type="button"
                  className="forgot-back-btn"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Halaman Masuk</span>
                </button>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authError && (
                <div className="auth-error-banner">
                  <AlertTriangle size={14} />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="auth-success-banner">
                  <CheckCircle2 size={14} />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {/* FORM MODE: REGISTER */}
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <label className="form-label">
                      <User size={13} />
                      <span>Nama Lengkap</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Budi Santoso"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                    />
                  </div>

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
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Minimal 6 karakter"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <KeyRound size={13} />
                      <span>PIN Keamanan Pemulihan (4-6 Angka)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className="form-input"
                      placeholder="Contoh: 123456"
                      value={recoveryPinInput}
                      onChange={(e) => setRecoveryPinInput(e.target.value.replace(/\D/g, ''))}
                    />
                    <span className="field-hint-text">
                      *Digunakan untuk mereset kata sandi mandiri jika sewaktu-waktu lupa akun.
                    </span>
                  </div>

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
                          Tugas yang ada di HP ini akan langsung disimpan aman ke akun cloud barumu.
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* FORM MODE: LOGIN */}
              {authMode === 'login' && (
                <>
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
                    <div className="label-with-action">
                      <label className="form-label">
                        <Lock size={13} />
                        <span>Kata Sandi</span>
                      </label>
                      <button
                        type="button"
                        className="btn-forgot-password-link"
                        onClick={() => {
                          setAuthMode('forgot');
                          setForgotStep(1);
                          setAuthError(null);
                          setAuthSuccessMsg(null);
                        }}
                      >
                        Lupa sandi?
                      </button>
                    </div>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Masukkan kata sandi"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

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
                        <strong>Gabungkan data tugas lokal saat ini</strong>
                        <p className="text-xs text-muted">
                          Tugas di HP ini akan digabungkan dengan tugas yang tersimpan di cloud.
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* FORM MODE: FORGOT PASSWORD */}
              {authMode === 'forgot' && (
                <>
                  {forgotStep === 1 ? (
                    <>
                      <div className="auth-security-notice info-blue">
                        <Info size={16} className="text-blue flex-shrink-0" />
                        <div className="notice-text">
                          <strong>Pemulihan Mandiri Cepat:</strong>
                          <p>
                            Masukkan email terdaftar dan PIN Keamanan Pemulihan yang Anda buat saat pendaftaran.
                          </p>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Mail size={13} />
                          <span>Alamat Email Akun</span>
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="nama@email.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <KeyRound size={13} />
                          <span>PIN Keamanan Pemulihan</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          className="form-input"
                          placeholder="Masukkan PIN 4-6 angka"
                          value={recoveryPinInput}
                          onChange={(e) => setRecoveryPinInput(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">
                          <Lock size={13} />
                          <span>Kata Sandi Baru</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Minimal 6 karakter"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          <Lock size={13} />
                          <span>Ulangi Kata Sandi Baru</span>
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Ketik ulang kata sandi baru"
                          value={confirmNewPasswordInput}
                          onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}
                </>
              )}

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
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn size={14} />
                      <span>Masuk Akun</span>
                    </>
                  ) : forgotStep === 1 ? (
                    <>
                      <Check size={14} />
                      <span>Verifikasi PIN</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Simpan Sandi Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PENGATURAN PROFIL & GANTI KATA SANDI (LOGIN USER)
          ========================================================================= */}
      {isProfileModalOpen && currentUser && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Settings size={18} className="text-primary" />
                <h3 className="modal-title">Pengaturan Akun & Profil</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="auth-form">
              {profileMsg && (
                <div className={`auth-${profileMsg.type}-banner`}>
                  {profileMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <Mail size={13} />
                  <span>Email Akun (Tetap)</span>
                </label>
                <input
                  type="email"
                  className="form-input input-disabled"
                  value={currentUser.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={13} />
                  <span>Nama Tampilan</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div className="profile-section-divider">
                <span>Ganti Kata Sandi (Opsional)</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} />
                  <span>Kata Sandi Saat Ini</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Diperlukan jika ingin mengubah sandi"
                  value={editOldPassword}
                  onChange={(e) => setEditOldPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} />
                  <span>Kata Sandi Baru</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                />
              </div>

              <div className="profile-section-divider">
                <span>PIN Pemulihan (Opsional)</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <KeyRound size={13} />
                  <span>PIN Keamanan Baru</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className="form-input"
                  placeholder="Kosongkan jika tidak ingin mengubah PIN"
                  value={editRecoveryPin}
                  onChange={(e) => setEditRecoveryPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="auth-form-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="btn-submit-auth"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: KONFIRMASI LOGOUT DENGAN PILIHAN DATA LOKAL
          ========================================================================= */}
      {isLogoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <LogOut size={18} className="text-muted" />
                <h3 className="modal-title">Keluar dari Akun</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-form">
              <p className="logout-desc-text">
                Data Anda di cloud tetap aman tersimpan. Bagaimana Anda ingin menangani data tugas di HP ini?
              </p>

              <div className="logout-choices">
                <label
                  className={`logout-choice-card ${!logoutClearLocal ? 'selected' : ''}`}
                  onClick={() => setLogoutClearLocal(false)}
                >
                  <input
                    type="radio"
                    name="logoutChoice"
                    checked={!logoutClearLocal}
                    onChange={() => setLogoutClearLocal(false)}
                  />
                  <div className="choice-text">
                    <strong>Tetap Simpan Tugas di HP Ini (Disarankan)</strong>
                    <span>Beralih ke mode tamu. Anda tetap bisa melihat dan mengedit tugas secara offline.</span>
                  </div>
                </label>

                <label
                  className={`logout-choice-card ${logoutClearLocal ? 'selected' : ''}`}
                  onClick={() => setLogoutClearLocal(true)}
                >
                  <input
                    type="radio"
                    name="logoutChoice"
                    checked={logoutClearLocal}
                    onChange={() => setLogoutClearLocal(true)}
                  />
                  <div className="choice-text">
                    <strong>Bersihkan Tugas dari HP Ini</strong>
                    <span>Cocok jika ini adalah perangkat umum atau Anda ingin memulai dari layar bersih.</span>
                  </div>
                </label>
              </div>

              <div className="auth-form-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-logout-confirm"
                  onClick={handleConfirmLogout}
                >
                  <LogOut size={14} />
                  <span>Konfirmasi Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DANGER ZONE RESET SEMUA DATA (2 TAHAP)
          ========================================================================= */}
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

      {/* =========================================================================
          MODAL 5: KIRIM MASUKAN (FEEDBACK)
          ========================================================================= */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
