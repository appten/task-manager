'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Shield,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Settings,
  AlertTriangle,
  Trash2,
  X,
  Smartphone,
  Check,
  Info,
  ChevronRight,
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  FileJson,
  Laptop,
  Tablet,
  Wifi,
  WifiOff,
  Globe,
  DownloadCloud,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';
import { VersionHistoryView } from './VersionHistoryView';
import { FeedbackModal } from './FeedbackModal';
import { TenLoginPopupButton } from './TenLoginPopupButton';
import { APP_CURRENT_VERSION } from '../data/versionHistory';

export const AccountView: React.FC = () => {
  const {
    tasks,
    todayTasks,
    currentUser,
    isSyncingCloud,
    lastCloudSyncedAt,
    isAutoSyncEnabled,
    refreshUserSession,
    storageMode,
    setStorageMode,
    isAutoOfflineFallbackEnabled,
    toggleAutoOfflineFallback,
    isOnline,
    activeDevices,
    refreshActiveDevices,
    revokeDeviceSession,
    logoutUser,
    triggerCloudSync,
    syncLocalTasksToKV,
    toggleAutoSync,
    clearAllTasksAndStartFresh,
    exportBackupData,
    importBackupData,
    showToast,
  } = useTask();

  // Modal states
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [logoutClearLocal, setLogoutClearLocal] = useState(false);

  // Danger Zone Reset state (2-step confirmation with phrase)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA';

  // Manual Backup & Restore states
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreFilePayload, setRestoreFilePayload] = useState<any>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Multi-Device & PWA states
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isRevokingDevice, setIsRevokingDevice] = useState<string | null>(null);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  // PWA Prompt & Display Mode Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsPwaInstalled(isStandalone);

      if ((window as any).deferredPwaPrompt) {
        setCanInstallPwa(true);
      }

      const handlePwaReady = () => setCanInstallPwa(true);
      const handleAppInstalled = () => {
        setIsPwaInstalled(true);
        setCanInstallPwa(false);
      };

      window.addEventListener('pwa_prompt_ready', handlePwaReady);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('pwa_prompt_ready', handlePwaReady);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallPwa = async () => {
    const promptEvent = (window as any).deferredPwaPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result && result.outcome === 'accepted') {
        showToast('Aplikasi TEN Tasks berhasil dipasang! 🎉');
        setCanInstallPwa(false);
        setIsPwaInstalled(true);
      }
      (window as any).deferredPwaPrompt = null;
    } else {
      showToast('Aplikasi dapat dipasang via menu browser Anda ("Tambahkan ke Layar Utama")');
    }
  };

  const handleRevokeDevice = async (deviceId: string, deviceName: string) => {
    if (!window.confirm(`Yakin ingin mencabut sesi untuk "${deviceName}"? Perangkat tersebut harus login kembali.`)) {
      return;
    }
    try {
      setIsRevokingDevice(deviceId);
      await revokeDeviceSession(deviceId);
      showToast(`Akses sesi perangkat "${deviceName}" berhasil dicabut.`);
    } catch (err: any) {
      showToast(`Gagal mencabut perangkat: ${err.message || 'Error'}`);
    } finally {
      setIsRevokingDevice(null);
    }
  };

  // Pantau fokus jendela, visibility & storage agar saat kembali dari SSO TEN, status akun langsung aktif
  useEffect(() => {
    refreshUserSession();

    const checkSessionState = () => {
      const activeUser = refreshUserSession();
      if (activeUser && !currentUser) {
        // State sudah otomatis diperbarui oleh refreshUserSession
      }
    };

    window.addEventListener('focus', checkSessionState);
    window.addEventListener('storage', checkSessionState);
    window.addEventListener('visibilitychange', checkSessionState);
    window.addEventListener('ten_auth_changed', checkSessionState);

    return () => {
      window.removeEventListener('focus', checkSessionState);
      window.removeEventListener('storage', checkSessionState);
      window.removeEventListener('visibilitychange', checkSessionState);
      window.removeEventListener('ten_auth_changed', checkSessionState);
    };
  }, [currentUser, refreshUserSession]);

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

  // Manual Backup Handlers
  const handleExportBackup = () => {
    try {
      const fileName = exportBackupData();
      showToast(`Berkas cadangan berhasil diunduh: ${fileName}`);
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat berkas cadangan.');
    }
  };

  const handleTriggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const tasksArray = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.data?.tasks)
          ? parsed.data.tasks
          : Array.isArray(parsed?.tasks)
          ? parsed.tasks
          : null;

        const hasGoal = Boolean(parsed?.data?.userGoal || parsed?.userGoal);

        if (!tasksArray && !hasGoal) {
          showToast('Berkas tidak valid: format tugas tidak dikenali.');
          return;
        }

        setRestoreFilePayload(parsed);
        setRestoreFileName(file.name);
        setRestoreMode('merge');
        setRestoreError(null);
        setIsRestoreModalOpen(true);
      } catch (err: any) {
        showToast('Gagal membaca berkas JSON. Pastikan berkas berformat .json yang benar.');
      }
    };
    reader.readAsText(file);
  };

  // Helper memo untuk ekstraksi data pratinjau modal pemulihan
  const previewTasksCount = React.useMemo(() => {
    if (!restoreFilePayload) return 0;
    if (Array.isArray(restoreFilePayload)) return restoreFilePayload.length;
    if (Array.isArray(restoreFilePayload?.data?.tasks)) return restoreFilePayload.data.tasks.length;
    if (Array.isArray(restoreFilePayload?.tasks)) return restoreFilePayload.tasks.length;
    return 0;
  }, [restoreFilePayload]);

  const previewGoalText = React.useMemo(() => {
    if (!restoreFilePayload) return '';
    const raw = restoreFilePayload?.data?.userGoal ?? restoreFilePayload?.userGoal;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw.text) return raw.text;
    return String(raw);
  }, [restoreFilePayload]);

  const previewExportedDate = React.useMemo(() => {
    if (!restoreFilePayload) return 'Format Standar';
    const rawDate = restoreFilePayload?.exportedAt || restoreFilePayload?.createdAt;
    if (!rawDate) return 'Format Standar';
    try {
      return new Date(rawDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Format Standar';
    }
  }, [restoreFilePayload]);

  const handleExecuteRestore = () => {
    if (!restoreFilePayload) return;
    setIsRestoring(true);
    setRestoreError(null);

    try {
      const result = importBackupData(restoreFilePayload, restoreMode);
      if (result.success) {
        setIsRestoreModalOpen(false);
        setRestoreFilePayload(null);
        showToast(
          `Berhasil memulihkan ${result.count} tugas (${
            restoreMode === 'merge' ? 'Digabungkan dengan tugas saat ini' : 'Menimpa seluruh data'
          }).`
        );
      } else {
        setRestoreError(result.error || 'Gagal memulihkan berkas cadangan.');
      }
    } catch (err: any) {
      setRestoreError(err.message || 'Terjadi kesalahan saat memproses pemulihan data.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (showVersionHistory) {
    return <VersionHistoryView onBack={() => setShowVersionHistory(false)} />;
  }

  return (
    <div className="account-view-container">
      {/* 1. Header Profil Pengguna */}
      <div className="account-clean-header">
        <div className={`account-avatar-circle ${currentUser ? 'logged-in' : 'guest'}`} style={{ overflow: 'hidden' }}>
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : currentUser ? (
            <span className="avatar-initial">{currentUser.name.charAt(0).toUpperCase()}</span>
          ) : (
            <User size={30} />
          )}
        </div>

        <div className="account-profile-info">
          <div className="account-profile-top-line">
            <h2 className="account-user-name">{currentUser ? currentUser.name : 'Pengguna Tamu'}</h2>
          </div>

          {currentUser?.username && (
            <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 700, marginTop: '-2px', marginBottom: '2px' }}>
              {currentUser.username.startsWith('@') ? currentUser.username : `@${currentUser.username}`}
            </div>
          )}

          <span className="account-email">
            {currentUser ? currentUser.email : 'Mode Offline • Autentikasi tunggal via SSO TEN'}
          </span>

          <div className="account-badges-row">
            <div className={`account-status-badge ${currentUser ? 'cloud-active' : 'guest'}`}>
              <span className={`status-dot ${currentUser ? 'pulsing-green' : 'gray'}`}></span>
              <span>{currentUser ? 'SSO TEN Aktif' : 'Mode Tamu (Lokal)'}</span>
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

            {/* Hanya tampilkan badge jika ada peran atau status */}
          </div>

          {currentUser && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  width: 'fit-content',
                }}
              >
                <Shield size={11} />
                <span>Dashboard Token Akun</span>
                <ChevronRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Tombol Aksi Masuk Tunggal / Keluar */}
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
            <TenLoginPopupButton
              buttonText="Masuk/Daftar Akun"
              style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px' }}
            />
          )}
        </div>
      </div>      {/* 2. Kartu Status Penyimpanan Data & Mode Operasi */}
      <div className="account-sync-card">
        <div className="sync-card-header">
          <div className={`sync-icon-box ${currentUser ? 'cloud-active' : 'local-only'}`}>
            {currentUser ? (
              storageMode === 'cloud_priority' ? (
                <Globe size={20} />
              ) : isAutoSyncEnabled ? (
                <Cloud size={20} />
              ) : (
                <Smartphone size={20} />
              )
            ) : (
              <Smartphone size={20} />
            )}
          </div>
          <div className="sync-header-content">
            <div className="sync-title-row">
              <h3 className="sync-title">Penyimpanan & Sinkronisasi</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`network-pill ${isOnline ? 'online' : 'offline'}`}>
                  {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
                <span
                  className={`sync-pill ${
                    currentUser
                      ? storageMode === 'cloud_priority'
                        ? 'cloud-priority'
                        : isAutoSyncEnabled
                        ? 'active'
                        : 'paused'
                      : 'local'
                  }`}
                >
                  {currentUser
                    ? storageMode === 'cloud_priority'
                      ? 'Prioritas Cloud'
                      : isAutoSyncEnabled
                      ? 'Cloud & Perangkat'
                      : 'Hanya di Perangkat'
                    : 'Hanya di Perangkat'}
                </span>
              </div>
            </div>
            <div className="sync-status-text">
              {currentUser ? (
                storageMode === 'cloud_priority' ? (
                  <span>
                    Mode <strong>Prioritas Cloud</strong> aktif. Data disinkronkan langsung ke server cloud ({currentUser.email})
                    {isAutoOfflineFallbackEnabled ? ' dengan peralihan otomatis ke lokal jika koneksi terputus.' : '.'}
                  </span>
                ) : isAutoSyncEnabled ? (
                  <span>
                    Data tugas tersimpan di perangkat ini dan secara otomatis dicadangkan ke akun cloud Anda (<strong>{currentUser.email}</strong>).
                  </span>
                ) : (
                  <span>
                    Pencadangan otomatis dijeda. Catatan tugas saat ini hanya disimpan pada perangkat ini.
                  </span>
                )
              ) : (
                <span>
                  Semua catatan dan tugas Anda saat ini tersimpan di memori perangkat ini (mode offline). Data tetap dapat digunakan dengan nyaman tanpa koneksi internet.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Kontrol Penyimpanan & Sinkronisasi Khusus Akun Terhubung */}
        {currentUser && (
          <div className="sync-card-body" style={{ marginTop: '2px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            {/* Baris Status Sinkronisasi & Tombol Perbarui Sekarang */}
            <div className="storage-sync-info-row">
              <div className="storage-sync-meta">
                <span className="storage-meta-label">Terakhir dicadangkan:</span>
                <span className="storage-meta-time">{formatLastSync(lastCloudSyncedAt)}</span>
              </div>

              <button
                type="button"
                className="btn-sync-now"
                onClick={() => triggerCloudSync()}
                disabled={isSyncingCloud}
                title="Cadangkan catatan tugas sekarang"
              >
                <RefreshCw size={13} className={isSyncingCloud ? 'spin-animation' : ''} />
                <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>

            {/* Pilihan Mode Penyimpanan: Prioritas Cloud vs Hibrida */}
            <div className="storage-mode-selector-wrap" style={{ marginTop: '6px' }}>
              <span className="storage-section-subtitle">Pilihan Mode Penyimpanan:</span>
              <div className="storage-mode-grid">
                <button
                  type="button"
                  className={`storage-mode-card ${storageMode === 'cloud_priority' ? 'active' : ''}`}
                  onClick={() => setStorageMode('cloud_priority')}
                >
                  <div className="mode-card-header">
                    <Globe size={15} />
                    <strong>Prioritas Cloud</strong>
                    {storageMode === 'cloud_priority' && <Check size={14} className="mode-check" />}
                  </div>
                  <p>Sinkron otomatis tanpa ketergantungan lokal saat terhubung internet.</p>
                </button>

                <button
                  type="button"
                  className={`storage-mode-card ${storageMode === 'hybrid' ? 'active' : ''}`}
                  onClick={() => setStorageMode('hybrid')}
                >
                  <div className="mode-card-header">
                    <Cloud size={15} />
                    <strong>Hibrida (Lokal & Cloud)</strong>
                    {storageMode === 'hybrid' && <Check size={14} className="mode-check" />}
                  </div>
                  <p>Simpan di memori browser ini dan cadangkan ke cloud saat tersambung.</p>
                </button>
              </div>
            </div>

            {/* Fitur On / Off Cadangan Offline Otomatis */}
            <div className="storage-auto-sync-box" style={{ marginTop: '8px' }}>
              <div className="auto-sync-desc">
                <strong>Peralihan Offline Otomatis</strong>
                <span>Gunakan penyimpanan lokal secara otomatis saat perangkat tidak memiliki koneksi internet</span>
              </div>
              <label className="auto-sync-switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isAutoOfflineFallbackEnabled}
                  onChange={toggleAutoOfflineFallback}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Fitur On / Off Sinkronisasi Otomatis */}
            <div className="storage-auto-sync-box">
              <div className="auto-sync-desc">
                <strong>Sinkronisasi Otomatis ke Cloud</strong>
                <span>Setiap perubahan tugas langsung disimpan ke cloud agar selalu aman</span>
              </div>
              <label className="auto-sync-switch" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isAutoSyncEnabled}
                  onChange={toggleAutoSync}
                />
                <span className="switch-slider"></span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 Kartu Perangkat Terhubung (Multi-Device Active Tracker) */}
      {currentUser && (
        <div className="account-sync-card account-devices-card">
          <div className="sync-card-header">
            <div className="sync-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <Laptop size={20} />
            </div>
            <div className="sync-header-content">
              <div className="sync-title-row">
                <h3 className="sync-title">Perangkat Terhubung ({activeDevices.length || 1})</h3>
                <button
                  type="button"
                  className="btn-devices-refresh"
                  onClick={() => refreshActiveDevices()}
                  title="Segarkan status perangkat aktif"
                >
                  <RefreshCw size={12} />
                  <span>Segarkan</span>
                </button>
              </div>
              <div className="sync-status-text">
                Daftar perangkat yang aktif mengakses akun <strong>{currentUser.email}</strong>. Anda dapat mencabut sesi perangkat yang tidak dikenali kapan saja.
              </div>
            </div>
          </div>

          <div className="device-list-wrap">
            {activeDevices.length === 0 ? (
              <div className="device-list-empty">
                <span>Memuat daftar perangkat aktif...</span>
              </div>
            ) : (
              activeDevices.map((device) => (
                <div key={device.id} className={`device-item ${device.isCurrentDevice ? 'current-device' : ''}`}>
                  <div className="device-icon-wrapper">
                    {device.type === 'mobile' ? (
                      <Smartphone size={18} />
                    ) : device.type === 'tablet' ? (
                      <Tablet size={18} />
                    ) : (
                      <Laptop size={18} />
                    )}
                  </div>
                  <div className="device-details">
                    <div className="device-name-row">
                      <strong className="device-name">{device.name}</strong>
                      {device.isCurrentDevice && (
                        <span className="device-current-badge">
                          <Check size={11} /> Perangkat Ini (Aktif)
                        </span>
                      )}
                    </div>
                    <div className="device-meta-row">
                      <span>{device.browser} • {device.os}</span>
                      <span className="device-dot">•</span>
                      <span>Aktif: {formatLastSync(device.lastActiveAt)}</span>
                    </div>
                  </div>
                  {!device.isCurrentDevice && (
                    <button
                      type="button"
                      className="btn-device-revoke"
                      onClick={() => handleRevokeDevice(device.id, device.name)}
                      disabled={isRevokingDevice === device.id}
                      title="Cabut sesi dari perangkat ini"
                    >
                      {isRevokingDevice === device.id ? 'Mencabut...' : 'Cabut Sesi'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2.8 Kartu Aplikasi Web Progresif (PWA) */}
      <div className="account-sync-card pwa-install-card">
        <div className="sync-card-header">
          <div className="sync-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <DownloadCloud size={20} />
          </div>
          <div className="sync-header-content">
            <div className="sync-title-row">
              <h3 className="sync-title">Aplikasi Web Progresif (PWA)</h3>
              <span className={`sync-pill ${isPwaInstalled ? 'active' : 'pwa-ready'}`}>
                {isPwaInstalled ? 'Terpasang' : 'Tersedia'}
              </span>
            </div>
            <div className="sync-status-text">
              {isPwaInstalled ? (
                <span>Aplikasi TEN Tasks telah terpasang dan dapat dibuka mandiri di layar utama Anda.</span>
              ) : (
                <span>Pasang TEN Tasks di ponsel atau desktop Anda untuk akses secepat aplikasi bawaan, tanpa address bar browser, serta kemampuan offline.</span>
              )}
            </div>
          </div>
        </div>

        {!isPwaInstalled && (
          <div className="sync-card-body" style={{ marginTop: '2px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="btn-install-pwa-cta"
              onClick={handleInstallPwa}
            >
              <DownloadCloud size={15} />
              <span>Pasang TEN Tasks ke Layar Utama</span>
            </button>
          </div>
        )}
      </div>

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

      {/* 4. Kartu Pencadangan & Pemulihan Berkas Manual (Offline / File JSON) */}
      <div className="account-sync-card manual-backup-card">
        <div className="sync-card-header">
          <div className="sync-icon-box manual-backup-icon-box">
            <HardDrive size={18} className="text-primary" />
          </div>
          <div className="sync-header-content">
            <div className="sync-title-row">
              <h3 className="sync-title">Pencadangan Manual (File JSON)</h3>
              <span className="sync-pill manual-pill">Format .JSON</span>
            </div>
            <div className="sync-status-text">
              Cadangkan & pulihkan tugas secara mandiri langsung ke file di perangkat Anda tanpa perlu koneksi internet.
            </div>
          </div>
        </div>

        <div className="sync-card-body manual-backup-body">
          <div className="manual-backup-actions-grid">
            <button
              type="button"
              className="btn-manual-backup-export"
              onClick={handleExportBackup}
              title="Unduh seluruh data tugas dan sasaran ke berkas .json"
            >
              <Download size={14} />
              <span>Unduh Cadangan (.json)</span>
            </button>

            <button
              type="button"
              className="btn-manual-backup-import"
              onClick={handleTriggerFileSelect}
              title="Pilih berkas .json dari perangkat untuk memulihkan tugas"
            >
              <Upload size={14} />
              <span>Pulihkan dari File (.json)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json,application/json"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* 5. Kartu Informasi & Pengaturan Aplikasi */}
      <div className="account-info-card">
        <button
          type="button"
          className="info-box-row info-box-row-clickable"
          onClick={() => setShowVersionHistory(true)}
          aria-label="Buka riwayat versi aplikasi"
        >
          <span className="info-box-label">
            <Sparkles size={15} className="text-primary" />
            <span>Versi Aplikasi</span>
          </span>
          <span className="info-box-val clickable-version">
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
          <span className="info-box-label">
            <Info size={15} className="text-primary" />
            <span>Kirim Masukan (Feedback)</span>
          </span>
          <span className="info-box-val clickable-version">
            Beri Saran & Lapor Bug
            <ChevronRight size={14} className="version-chevron" />
          </span>
        </button>

        {currentUser && currentUser.role === 'admin' && (
          <Link
            href="/admin"
            className="info-box-row info-box-row-clickable"
            aria-label="Akses panel pengelola"
          >
            <span className="info-box-label">
              <ShieldCheck size={15} className="text-primary" />
              <span>Panel Pengelola & Statistik</span>
            </span>
            <span className="info-box-val clickable-version">
              Akses Pengelola
              <ChevronRight size={14} className="version-chevron" />
            </span>
          </Link>
        )}
      </div>

      {/* 6. Zona Bahaya: Reset Seluruh Data Lokal */}
      <div className="account-danger-card">
        <div className="danger-card-top">
          <div className="danger-card-icon-wrap">
            <AlertTriangle size={16} />
          </div>
          <div className="danger-card-info">
            <h4 className="danger-card-title">Zona Bahaya</h4>
            <p className="danger-card-desc">
              Hapus seluruh daftar tugas, riwayat penyelesaian, sasaran hidup tahunan, serta pengaturan di browser ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-danger-reset-trigger"
          onClick={handleOpenResetModal}
        >
          <Trash2 size={13} />
          <span>Hapus Semua Data Aplikasi</span>
        </button>
      </div>

      {/* =========================================================================
          MODAL: KONFIRMASI LOGOUT DENGAN PILIHAN DATA LOKAL
          ========================================================================= */}
      {isLogoutModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-container auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <LogOut size={18} className="text-muted" />
                <h3 className="modal-title">Keluar dari Akun SSO TEN</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="auth-form">
              <p className="logout-desc-text" style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
                Catatan tugas Anda di akun cloud tetap tersimpan aman. Bagaimana Anda ingin menangani catatan dan riwayat tugas pada perangkat ini?
              </p>

              <div className="logout-choices" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  className={`logout-choice-card ${!logoutClearLocal ? 'selected' : ''}`}
                  onClick={() => setLogoutClearLocal(false)}
                  style={{
                    border: !logoutClearLocal ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    background: !logoutClearLocal ? '#eff6ff' : '#f8fafc',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <input
                    type="radio"
                    name="logoutChoice"
                    checked={!logoutClearLocal}
                    onChange={() => setLogoutClearLocal(false)}
                    style={{ marginTop: '3px' }}
                  />
                  <div className="choice-text">
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      Tetap Simpan Catatan di Perangkat Ini (Perangkat Pribadi)
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                      Beralih ke mode offline. Catatan tugas tetap dapat Anda buka dan gunakan di perangkat ini.
                    </span>
                  </div>
                </label>

                <label
                  className={`logout-choice-card ${logoutClearLocal ? 'selected' : ''}`}
                  onClick={() => setLogoutClearLocal(true)}
                  style={{
                    border: logoutClearLocal ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                    background: logoutClearLocal ? '#fef2f2' : '#f8fafc',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <input
                    type="radio"
                    name="logoutChoice"
                    checked={logoutClearLocal}
                    onChange={() => setLogoutClearLocal(true)}
                    style={{ marginTop: '3px' }}
                  />
                  <div className="choice-text">
                    <strong style={{ fontSize: '13px', color: logoutClearLocal ? '#b91c1c' : '#0f172a', display: 'block' }}>
                      Bersihkan Seluruh Catatan & Riwayat (Bebas Jejak Privasi)
                    </strong>
                    <span style={{ fontSize: '11.5px', color: logoutClearLocal ? '#991b1b' : '#64748b', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                      Sangat disarankan untuk komputer bersama, kantor, atau warnet. Semua tugas, riwayat, dan sesi lokal akan dikosongkan total agar tidak ada celah data bagi pengguna berikutnya.
                    </span>
                  </div>
                </label>
              </div>

              <div className="auth-form-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                  style={{
                    background: logoutClearLocal ? '#dc2626' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LogOut size={14} />
                  <span>{logoutClearLocal ? 'Keluar & Bersihkan Data' : 'Konfirmasi Keluar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DANGER ZONE RESET SEMUA DATA (2 TAHAP)
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
          MODAL: RESTORE CADANGAN BERKAS MANUAL (OFFLINE)
          ========================================================================= */}
      {isRestoreModalOpen && (
        <div
          className="restore-modal-overlay"
          onClick={() => {
            if (!isRestoring) {
              setIsRestoreModalOpen(false);
              setRestoreFilePayload(null);
            }
          }}
        >
          <div className="restore-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="restore-modal-header">
              <div className="restore-modal-title-group">
                <div className="restore-badge-icon">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h3 className="restore-modal-title">Pulihkan Data dari Berkas</h3>
                  <span className="restore-modal-subtitle">
                    Cadangan mandiri tanpa internet (.json)
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="restore-close-btn"
                disabled={isRestoring}
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setRestoreFilePayload(null);
                }}
                aria-label="Tutup dialog"
              >
                <X size={17} />
              </button>
            </div>

            <div className="restore-modal-body">
              {/* Ringkasan file */}
              <div className="restore-file-summary-box">
                <div className="summary-file-header">
                  <FileJson size={16} className="text-primary flex-shrink-0" />
                  <span className="summary-file-name" title={restoreFileName}>
                    {restoreFileName}
                  </span>
                </div>
                <div className="summary-file-grid">
                  <div className="summary-pill">
                    <span className="summary-pill-label">Waktu Ekspor:</span>
                    <span className="summary-pill-val">
                      {previewExportedDate}
                    </span>
                  </div>
                  <div className="summary-pill">
                    <span className="summary-pill-label">Jumlah Tugas:</span>
                    <span className="summary-pill-val font-bold">
                      {previewTasksCount} Tugas
                    </span>
                  </div>
                  <div className="summary-pill full-width">
                    <span className="summary-pill-label">Sasaran Hidup:</span>
                    <span className="summary-pill-val">
                      {previewGoalText ? `"${previewGoalText}"` : 'Tidak ada data sasaran'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pilihan Metode Pemulihan */}
              <div className="restore-mode-section">
                <label className="restore-section-label">Pilih Mode Pemulihan:</label>
                <div className="restore-mode-options">
                  <div
                    className={`restore-mode-option ${restoreMode === 'merge' ? 'selected' : ''}`}
                    onClick={() => setRestoreMode('merge')}
                  >
                    <div className="restore-mode-radio">
                      <div className={`radio-circle ${restoreMode === 'merge' ? 'checked' : ''}`} />
                    </div>
                    <div className="restore-mode-content">
                      <div className="restore-mode-top">
                        <span className="restore-mode-title">Gabungkan Data (Merge)</span>
                        <span className="mode-badge-recommended">Direkomendasikan</span>
                      </div>
                      <p className="restore-mode-desc">
                        Tugas dari berkas akan ditambahkan ke daftar tugas saat ini. Tugas lama tidak hilang, dan tugas dengan ID sama akan diperbarui.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`restore-mode-option ${restoreMode === 'replace' ? 'selected' : ''}`}
                    onClick={() => setRestoreMode('replace')}
                  >
                    <div className="restore-mode-radio">
                      <div className={`radio-circle ${restoreMode === 'replace' ? 'checked' : ''}`} />
                    </div>
                    <div className="restore-mode-content">
                      <div className="restore-mode-top">
                        <span className="restore-mode-title">Timpa Seluruh Data (Replace)</span>
                        <span className="mode-badge-replace">Timpa Penuh</span>
                      </div>
                      <p className="restore-mode-desc">
                        Menghapus seluruh tugas yang ada saat ini dan menggantikannya secara total dengan isi dari berkas cadangan ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {restoreMode === 'replace' && (
                <div className="restore-alert-callout warning">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>
                    Perhatian: Seluruh tugas saat ini yang tidak terdapat dalam berkas ini akan terhapus.
                  </span>
                </div>
              )}

              {restoreError && (
                <div className="restore-alert-callout error">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              <div className="restore-modal-footer">
                <button
                  type="button"
                  className="btn-restore-cancel"
                  disabled={isRestoring}
                  onClick={() => {
                    setIsRestoreModalOpen(false);
                    setRestoreFilePayload(null);
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-restore-confirm"
                  disabled={isRestoring}
                  onClick={handleExecuteRestore}
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw size={14} className="spin-animation" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Pulihkan Data Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KIRIM MASUKAN (FEEDBACK)
          ========================================================================= */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};
