'use client';

import React from 'react';
import {
  User,
  Shield,
  Sparkles,
  HardDrive,
  Cloud,
  Construction,
  Info,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';

export const AccountView: React.FC = () => {
  const { tasks, todayTasks } = useTask();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="account-view-container">
      {/* 1. Header Akun */}
      <div className="account-header">
        <div className="account-avatar-circle">
          <User size={36} />
        </div>
        <h2 className="account-user-name">Pengguna TEN</h2>
        <span className="account-email">aplikasi.ten@gmail.com</span>
        <div className="account-status-badge">
          <span className="status-dot"></span>
          <span>Lokal & Edge Ready</span>
        </div>
      </div>

      {/* 2. Banner "Fitur Sedang Dalam Pengembangan" */}
      <div className="account-wip-card">
        <div className="wip-icon-circle">
          <Construction size={24} />
        </div>
        <div className="wip-content">
          <h3 className="wip-title">Fitur Sedang Dalam Pengembangan 🚀</h3>
          <p className="wip-desc">
            Halaman pengaturan akun, manajemen profil, preferensi notifikasi, dan sinkronisasi multi-device sedang dipersiapkan dan akan segera hadir pada pembaruan mendatang.
          </p>
        </div>
      </div>

      {/* 3. Ringkasan Statistik Akun */}
      <div className="account-stats-grid">
        <div className="account-stat-box">
          <span className="stat-number">{totalTasks}</span>
          <span className="stat-label">Total Item</span>
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

      {/* 4. Menu Pengaturan Mendatang (Preview) */}
      <div className="account-menu-section">
        <h4 className="account-section-title">Menu Mendatang</h4>
        
        <div className="account-menu-list">
          <div className="account-menu-item disabled">
            <div className="menu-item-left">
              <User size={18} />
              <div>
                <div className="menu-item-title">Edit Profil & Nama</div>
                <div className="menu-item-sub">Segera hadir</div>
              </div>
            </div>
            <span className="wip-pill">WIP</span>
          </div>

          <div className="account-menu-item disabled">
            <div className="menu-item-left">
              <Cloud size={18} />
              <div>
                <div className="menu-item-title">Sinkronisasi Cloudflare D1</div>
                <div className="menu-item-sub">Sinkronisasi multi-perangkat</div>
              </div>
            </div>
            <span className="wip-pill">WIP</span>
          </div>

          <div className="account-menu-item disabled">
            <div className="menu-item-left">
              <Shield size={18} />
              <div>
                <div className="menu-item-title">Keamanan & Kunci Aplikasi</div>
                <div className="menu-item-sub">PIN & Biometrik</div>
              </div>
            </div>
            <span className="wip-pill">WIP</span>
          </div>
        </div>
      </div>

      {/* 5. Informasi Sistem */}
      <div className="account-info-box">
        <div className="info-box-row">
          <span className="info-box-label">Versi Aplikasi</span>
          <span className="info-box-val">v1.0.0 (Cloudflare Edge)</span>
        </div>
        <div className="info-box-row">
          <span className="info-box-label">Penyimpanan Lokal</span>
          <span className="info-box-val text-green">
            <CheckCircle2 size={12} /> Browser LocalStorage Aktif
          </span>
        </div>
      </div>
    </div>
  );
};
