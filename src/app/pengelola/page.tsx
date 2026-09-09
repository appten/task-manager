'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  KeyRound,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  TrendingUp,
  Database,
  Layers,
  Sparkles,
  ChevronRight,
  UserX,
} from 'lucide-react';
import { cloudSyncService, UserProfile, AppStatistics, UserRole } from '@/services/cloudSyncService';
import { useTask } from '@/context/TaskContext';
import { APP_CURRENT_VERSION } from '@/data/versionHistory';

export default function PengelolaPage() {
  const { tasks, currentUser, showToast } = useTask();

  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AppStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);

  // Cek apakah pengguna saat ini adalah admin/pengelola
  const isAdmin =
    currentUser?.role === 'admin' ||
    (typeof window !== 'undefined' && cloudSyncService.getCurrentUser()?.role === 'admin');

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [usersList, appStats] = await Promise.all([
        cloudSyncService.getAllUsers(),
        cloudSyncService.getAppStatistics(tasks),
      ]);
      setUsers(usersList);
      setStats(appStats);
    } catch (err) {
      console.error('Gagal memuat data pengelola:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, tasks]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, loadData]);

  const handleToggleRole = async (targetUser: UserProfile) => {
    const currentRole = targetUser.role || 'user';
    const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    const newRoleLabel = newRole === 'admin' ? 'Pengelola' : 'User';

    const confirmMsg =
      newRole === 'admin'
        ? `Tingkatkan akun "${targetUser.name}" (${targetUser.email}) menjadi Pengelola?`
        : `Ubah akun "${targetUser.name}" (${targetUser.email}) menjadi User biasa?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingEmail(targetUser.email);
    try {
      const res = await cloudSyncService.updateUserRole(targetUser.email, newRole);
      if (res.success) {
        showToast(`Role akun ${targetUser.email} diubah menjadi ${newRoleLabel}`);
        await loadData();
      } else {
        showToast(res.error || 'Gagal mengubah role');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat mengubah role');
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Filter daftar akun
  const filteredUsers = users.filter((u) => {
    const role = u.role || 'user';
    const matchesRole = filterRole === 'all' || role === filterRole;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesRole;
    const matchesQuery =
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  if (!isAdmin) {
    return (
      <div className="mobile-viewport-wrapper pengelola-viewport-wrapper">
        <div className="pengelola-container">
          <header className="page-subnav-header dev-header">
            <Link href="/account" className="btn-subnav-back" title="Kembali ke Menu Akun">
              <ArrowLeft size={18} />
              <span>Akun</span>
            </Link>
            <div className="subnav-title-group">
              <h2 className="subnav-page-title">Panel Pengelola</h2>
              <span className="subnav-badge-caption">Terkunci 🔒</span>
            </div>
          </header>

          <div className="pengelola-content">
            <div className="pengelola-access-denied-box">
              <div className="access-denied-icon-circle">
                <ShieldAlert size={36} />
              </div>
              <h3 className="access-denied-title">Akses Ditolak: Khusus Pengelola</h3>
              <p className="access-denied-desc">
                Halaman ini dilindungi secara ketat dan hanya dapat diakses oleh akun yang memiliki peran <strong>Pengelola (Admin)</strong>.
              </p>
              <div className="access-denied-status-badge">
                <span>Status Anda: </span>
                <strong>
                  {currentUser ? `User Biasa (${currentUser.email})` : 'Tamu / Belum Masuk Akun'}
                </strong>
              </div>
              <div className="access-denied-actions">
                <Link href="/account" className="btn-access-denied-primary">
                  <ArrowLeft size={14} />
                  <span>Kembali ke Menu Akun</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-viewport-wrapper pengelola-viewport-wrapper">
      <div className="pengelola-container">
        {/* Header Navigasi */}
        <header className="page-subnav-header dev-header">
          <Link href="/account" className="btn-subnav-back" title="Kembali ke Menu Akun">
            <ArrowLeft size={18} />
            <span>Akun</span>
          </Link>
          <div className="subnav-title-group">
            <h2 className="subnav-page-title">Panel Pengelola</h2>
            <span className="subnav-badge-caption">Akses Khusus ({APP_CURRENT_VERSION})</span>
          </div>
          <button
            type="button"
            className="btn-refresh-feedbacks"
            onClick={loadData}
            disabled={isLoading}
            title="Segarkan data"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-animation' : ''} />
          </button>
        </header>

        {/* Content Area */}
        <div className="pengelola-content">
          {/* Banner Pengelola */}
          <div className="pengelola-hero-banner">
            <div className="pengelola-hero-header">
              <div className="pengelola-badge-icon">
                <ShieldAlert size={18} />
              </div>
              <div className="pengelola-badge-texts">
                <div className="pengelola-badge-title-row">
                  <h3 className="pengelola-badge-title">Dashboard Pengelola</h3>
                  <span className="pengelola-role-pill">Pengelola</span>
                </div>
                <p className="pengelola-badge-desc">
                  Pantau seluruh akun pengguna terdaftar dan statistik performa aplikasi secara langsung.
                </p>
              </div>
            </div>

            {/* Tab Navigasi Pengelola */}
            <div className="pengelola-tabs">
              <button
                type="button"
                className={`pengelola-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                <BarChart3 size={14} />
                <span>Statistik Aplikasi</span>
              </button>
              <button
                type="button"
                className={`pengelola-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={14} />
                <span>Daftar Akun ({users.length})</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              TAB 1: STATISTIK APLIKASI
              ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="pengelola-stats-section">
              {/* Metrik Utama 4 Kotak */}
              <div className="pengelola-metrics-grid">
                <div className="pengelola-metric-card">
                  <div className="metric-icon-wrap blue">
                    <Users size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">{stats?.totalUsers ?? 0}</span>
                    <span className="metric-title">Total Akun</span>
                    <span className="metric-subtitle">
                      {stats?.totalAdmins ?? 0} Pengelola • {stats?.totalRegularUsers ?? 0} User
                    </span>
                  </div>
                </div>

                <div className="pengelola-metric-card">
                  <div className="metric-icon-wrap green">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">{stats?.totalTasks ?? 0}</span>
                    <span className="metric-title">Total Tugas</span>
                    <span className="metric-subtitle">
                      {stats?.completedTasks ?? 0} Selesai • {stats?.activeTasks ?? 0} Aktif
                    </span>
                  </div>
                </div>

                <div className="pengelola-metric-card">
                  <div className="metric-icon-wrap purple">
                    <Clock size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">{stats?.totalFocusHours ?? 0} Jam</span>
                    <span className="metric-title">Waktu Fokus</span>
                    <span className="metric-subtitle">Terekam di stopwatch</span>
                  </div>
                </div>

                <div className="pengelola-metric-card">
                  <div className="metric-icon-wrap amber">
                    <TrendingUp size={18} />
                  </div>
                  <div className="metric-content">
                    <span className="metric-number">{stats?.totalFeedbacks ?? 0}</span>
                    <span className="metric-title">Masukan Masuk</span>
                    <Link href="/masukkan" className="metric-link">
                      <span>Buka Masukan</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Distribusi Kategori Tugas */}
              <div className="pengelola-card">
                <div className="pengelola-card-header">
                  <Layers size={16} className="text-primary" />
                  <h4 className="pengelola-card-title">Distribusi Kategori Tugas</h4>
                </div>
                <div className="category-bars-list">
                  {stats &&
                    Object.entries(stats.categoryDistribution).map(([cat, count]) => {
                      const total = stats.totalTasks || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={cat} className="category-bar-item">
                          <div className="cat-bar-labels">
                            <span className="cat-bar-name">{cat}</span>
                            <span className="cat-bar-count">
                              <strong>{count}</strong> tugas ({pct}%)
                            </span>
                          </div>
                          <div className="cat-progress-track">
                            <div
                              className={`cat-progress-fill cat-color-${cat.toLowerCase()}`}
                              style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Ringkasan Status Infrastruktur */}
              <div className="pengelola-card">
                <div className="pengelola-card-header">
                  <Database size={16} className="text-primary" />
                  <h4 className="pengelola-card-title">Status Infrastruktur & Penyimpanan</h4>
                </div>
                <div className="infra-status-list">
                  <div className="infra-status-row">
                    <span className="infra-label">Cloudflare KV Database</span>
                    <span className="infra-badge active">
                      <span className="status-dot pulsing-green"></span>
                      <span>Task_KV Siap</span>
                    </span>
                  </div>
                  <div className="infra-status-row">
                    <span className="infra-label">Versi Aplikasi</span>
                    <span className="infra-val font-semibold">{APP_CURRENT_VERSION}</span>
                  </div>
                  <div className="infra-status-row">
                    <span className="infra-label">Lingkungan Server</span>
                    <span className="infra-val">Lokal (Next.js & Wrangler Pages Dev)</span>
                  </div>
                  <div className="infra-status-row">
                    <span className="infra-label">Akun Sesi Saat Ini</span>
                    <span className="infra-val text-primary font-semibold">
                      {currentUser ? `${currentUser.name} (${currentUser.role || 'user'})` : 'Mode Tamu (Offline)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: DAFTAR AKUN-AKUN
              ========================================================================= */}
          {activeTab === 'users' && (
            <div className="pengelola-users-section">
              {/* Search & Filter Bar */}
              <div className="pengelola-search-bar-wrap">
                <div className="pengelola-search-input-box">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Cari nama atau email akun..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pengelola-search-input"
                  />
                </div>

                <div className="pengelola-role-filters">
                  <button
                    type="button"
                    className={`role-filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterRole('all')}
                  >
                    Semua ({users.length})
                  </button>
                  <button
                    type="button"
                    className={`role-filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setFilterRole('admin')}
                  >
                    Pengelola ({users.filter((u) => u.role === 'admin').length})
                  </button>
                  <button
                    type="button"
                    className={`role-filter-btn ${filterRole === 'user' ? 'active' : ''}`}
                    onClick={() => setFilterRole('user')}
                  >
                    User ({users.filter((u) => u.role !== 'admin').length})
                  </button>
                </div>
              </div>

              {/* List Kartu Akun */}
              <div className="pengelola-users-list">
                <div className="users-list-summary">
                  <span>
                    Menampilkan <strong>{filteredUsers.length}</strong> akun terdaftar
                  </span>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="pengelola-empty-box">
                    <Users size={32} className="text-muted" />
                    <h4>Tidak Ditemukan Akun</h4>
                    <p>Tidak ada akun yang sesuai dengan pencarian atau filter yang dipilih.</p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrentUser = currentUser?.email.toLowerCase() === u.email.toLowerCase();
                    const isAdmin = u.role === 'admin';
                    const isActionLoading = actionLoadingEmail === u.email;

                    return (
                      <div key={u.email} className={`user-account-card ${isAdmin ? 'admin-card' : ''}`}>
                        <div className="user-card-top">
                          <div className={`user-avatar-small ${isAdmin ? 'admin' : 'regular'}`}>
                            <span>{u.name.charAt(0).toUpperCase()}</span>
                          </div>

                          <div className="user-card-main-info">
                            <div className="user-card-name-row">
                              <h5 className="user-card-name">{u.name}</h5>
                              {isCurrentUser && <span className="user-self-pill">Anda</span>}
                            </div>
                            <span className="user-card-email">
                              <Mail size={11} />
                              {u.email}
                            </span>
                          </div>

                          {/* Role Badge */}
                          <div className="user-role-badge-wrap">
                            <span className={`user-role-pill ${isAdmin ? 'admin' : 'user'}`}>
                              {isAdmin ? (
                                <>
                                  <ShieldCheck size={11} />
                                  <span>Pengelola</span>
                                </>
                              ) : (
                                <>
                                  <Users size={11} />
                                  <span>User</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Detail Info Row */}
                        <div className="user-card-meta-row">
                          <div className="user-meta-item">
                            <Calendar size={11} />
                            <span>Terdaftar: {formatDate(u.createdAt)}</span>
                          </div>
                          <div className="user-meta-item">
                            <KeyRound size={11} />
                            <span>PIN: {u.recoveryPinSet ? 'Tersedia' : 'Belum'}</span>
                          </div>
                          {u.taskCount !== undefined && (
                            <div className="user-meta-item">
                              <Briefcase size={11} />
                              <span>{u.taskCount} tugas cloud</span>
                            </div>
                          )}
                        </div>

                        {/* Actions Row */}
                        <div className="user-card-actions-row">
                          <button
                            type="button"
                            className={`btn-toggle-role ${isAdmin ? 'downgrade' : 'upgrade'}`}
                            onClick={() => handleToggleRole(u)}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <>
                                <RefreshCw size={12} className="spin-animation" />
                                <span>Mengubah...</span>
                              </>
                            ) : isAdmin ? (
                              <>
                                <UserX size={12} />
                                <span>Ubah ke User</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck size={12} />
                                <span>Jadikan Pengelola</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
