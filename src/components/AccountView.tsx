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
  const activeTasks = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="account-view-container">
      {/* 1. Header Akun Mode Guest */}
      <div className="account-header">
        <div className="account-avatar-circle">
          <User size={36} />
        </div>
        <h2 className="account-user-name">Guest</h2>
        <span className="account-email">Mode Tamu (Sesi Lokal Device)</span>
        <div className="account-status-badge guest">
          <span className="status-dot green"></span>
          <span>Lokal Device Storage Aktif</span>
        </div>
      </div>

      {/* 2. Informasi Penyimpanan Lokal Device */}
      <div className="account-storage-card">
        <div className="storage-icon-circle">
          <HardDrive size={22} />
        </div>
        <div className="storage-content">
          <h3 className="storage-title">Data Tersimpan di Lokal Device 📱</h3>
          <p className="storage-desc">
            Seluruh data <strong>Inbox</strong>, <strong>Today</strong>, <strong>Kalender</strong>, dan <strong>Riwayat Tugas</strong> tersimpan secara langsung di memori lokal perangkat Anda (<em>Browser LocalStorage</em>).
          </p>
          <div className="storage-features-list">
            <div className="storage-feat-item">
              <CheckCircle2 size={13} className="text-green" />
              <span>Privasi penuh — Data tidak dikirimkan ke server eksternal</span>
            </div>
            <div className="storage-feat-item">
              <CheckCircle2 size={13} className="text-green" />
              <span>Dapat digunakan sepenuhnya secara offline tanpa internet</span>
            </div>
            <div className="storage-feat-item">
              <CheckCircle2 size={13} className="text-green" />
              <span>Data tetap tersimpan saat Anda menutup atau membuka kembali browser</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ringkasan Statistik Data Lokal */}
      <div className="account-stats-grid">
        <div className="account-stat-box">
          <span className="stat-number">{totalTasks}</span>
          <span className="stat-label">Total Item Lokal</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{todayTasks.length}</span>
          <span className="stat-label">Fokus Today</span>
        </div>
        <div className="account-stat-box">
          <span className="stat-number">{completedTasks}</span>
          <span className="stat-label">Riwayat Selesai</span>
        </div>
      </div>

      {/* 4. Banner "Fitur Sedang Dalam Pengembangan" */}
      <div className="account-wip-card">
        <div className="wip-icon-circle">
          <Construction size={22} />
        </div>
        <div className="wip-content">
          <h3 className="wip-title">Sinkronisasi Multi-Device (WIP) 🚀</h3>
          <p className="wip-desc">
            Fitur login akun, pencadangan otomatis ke cloud, dan sinkronisasi lintas perangkat saat ini sedang dalam pengembangan.
          </p>
        </div>
      </div>

      {/* 5. Informasi Teknis Sistem */}
      <div className="account-info-box">
        <div className="info-box-row">
          <span className="info-box-label">Status Akun</span>
          <span className="info-box-val">Guest (Tamu)</span>
        </div>
        <div className="info-box-row">
          <span className="info-box-label">Penyimpanan Utama</span>
          <span className="info-box-val text-green">
            <CheckCircle2 size={12} /> Local Device Storage (LocalStorage)
          </span>
        </div>
        <div className="info-box-row">
          <span className="info-box-label">Versi Aplikasi</span>
          <span className="info-box-val">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
