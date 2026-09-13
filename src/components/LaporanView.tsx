'use client';

import React, { useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Inbox,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  Briefcase,
  User,
  BookOpen,
  Heart,
  Coffee,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

export const LaporanView: React.FC = () => {
  const { tasks, todayTasks, userGoal, setActiveTab } = useTask();

  // Total dan rasio tugas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted);
  const activeTasks = tasks.filter((t) => !t.isCompleted);

  const completedCount = completedTasks.length;
  const activeCount = activeTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Akumulasi total waktu fokus tercatat dalam detik
  const totalFocusSeconds = useMemo(() => {
    return tasks.reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0);
  }, [tasks]);

  const formatHoursMinutes = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours === 0 && minutes === 0) return '0 menit';
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes} menit`;
  };

  // Distribusi per Kategori
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((t) => {
      const cat = t.category || 'Lainnya';
      if (!counts[cat]) {
        counts[cat] = { total: 0, completed: 0 };
      }
      counts[cat].total += 1;
      if (t.isCompleted) {
        counts[cat].completed += 1;
      }
    });

    return Object.entries(counts).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [tasks]);

  // Kategori Icon helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pekerjaan':
        return <Briefcase size={14} className="text-blue-500" />;
      case 'Pribadi':
        return <User size={14} className="text-purple-500" />;
      case 'Belajar':
        return <BookOpen size={14} className="text-indigo-500" />;
      case 'Kesehatan':
        return <Heart size={14} className="text-rose-500" />;
      case 'Istirahat':
        return <Coffee size={14} className="text-amber-500" />;
      case 'Relasi':
        return <HeartHandshake size={14} className="text-pink-500" />;
      default:
        return <Sparkles size={14} className="text-emerald-500" />;
    }
  };

  // Tugas Today aktif
  const todayActiveCount = todayTasks.filter((t) => !t.isCompleted).length;
  const todayCompletedCount = todayTasks.filter((t) => t.isCompleted).length;

  return (
    <div className="laporan-view-container animate-fade-in">
      {/* 1. Header Laporan */}
      <div className="laporan-clean-header">
        <div className="laporan-header-lead">
          <div className="laporan-icon-badge">
            <BarChart3 size={18} />
          </div>
          <div className="laporan-header-texts">
            <h2 className="laporan-heading">Laporan & Evaluasi Produktivitas</h2>
            <p className="laporan-subheading">
              Pantau tren penyelesaian tugas, durasi fokus nyata, dan keseimbangan kategori harian.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Kartu Metrik Utama */}
      <div className="laporan-metrics-grid">
        {/* Rasio Penyelesaian */}
        <div className="laporan-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Tingkat Tuntas</span>
            <div className="metric-icon-mini green">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="metric-main-value">{completionRate}%</div>
          <div className="metric-subtext">
            <strong>{completedCount}</strong> dari {totalTasks} tugas selesai
          </div>
          <div className="metric-progress-bar-bg">
            <div
              className="metric-progress-bar-fill"
              style={{ width: `${completionRate}%`, background: '#10b981' }}
            />
          </div>
        </div>

        {/* Waktu Fokus Tercatat */}
        <div className="laporan-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Waktu Fokus Tercatat</span>
            <div className="metric-icon-mini blue">
              <Clock size={13} />
            </div>
          </div>
          <div className="metric-main-value">{formatHoursMinutes(totalFocusSeconds)}</div>
          <div className="metric-subtext">Akumulasi stopwatch pengerjaan</div>
        </div>

        {/* Status Fokus Today */}
        <div className="laporan-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Fokus Today</span>
            <div className="metric-icon-mini amber">
              <Flame size={13} />
            </div>
          </div>
          <div className="metric-main-value">
            {todayCompletedCount}/{todayTasks.length || 0}
          </div>
          <div className="metric-subtext">
            {todayActiveCount > 0 ? `${todayActiveCount} tugas berjalan` : 'Semua tuntas / siap diisi'}
          </div>
        </div>

        {/* Item Aktif di Inbox */}
        <div className="laporan-metric-card">
          <div className="metric-card-top">
            <span className="metric-card-label">Sisa Inbox Aktif</span>
            <div className="metric-icon-mini indigo">
              <Inbox size={13} />
            </div>
          </div>
          <div className="metric-main-value">{activeCount}</div>
          <div className="metric-subtext">Item siap dipilah ke Today</div>
        </div>
      </div>

      {/* 3. Sasaran & Keselarasan Goal */}
      <div className="laporan-section-card">
        <div className="laporan-card-header">
          <div className="section-title-wrap">
            <Target size={15} className="text-amber-500" />
            <h3 className="section-title">Sasaran Utama Pengguna</h3>
          </div>
          <button
            type="button"
            className="btn-link-action"
            onClick={() => setActiveTab('pilah')}
          >
            <span>Pilah Tugas</span>
            <ArrowRight size={11} />
          </button>
        </div>
        <div className="laporan-goal-banner">
          <p className="goal-banner-text">
            {userGoal ? `"${userGoal}"` : 'Belum menentukan sasaran spesifik. Tetapkan sasaran di menu Akun / Pengaturan.'}
          </p>
          <span className="goal-banner-hint">
            💡 Sistem memprioritaskan tugas-tugas di menu Pilah yang selaras dengan sasaran ini.
          </span>
        </div>
      </div>

      {/* 4. Distribusi Tugas Berdasarkan Kategori */}
      <div className="laporan-section-card">
        <div className="laporan-card-header">
          <div className="section-title-wrap">
            <Layers size={15} className="text-indigo-500" />
            <h3 className="section-title">Distribusi Kategori Tugas</h3>
          </div>
        </div>

        <div className="category-stats-list">
          {categoryStats.map((item) => (
            <div key={item.category} className="category-stat-row">
              <div className="category-info-col">
                <div className="category-title-lead">
                  {getCategoryIcon(item.category)}
                  <span className="category-name">{item.category}</span>
                </div>
                <span className="category-count-badge">
                  {item.completed}/{item.total} selesai ({item.percent}%)
                </span>
              </div>
              <div className="category-bar-bg">
                <div
                  className="category-bar-fill"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Aksi Cepat Buka Riwayat / Inbox */}
      <div className="laporan-quick-actions-row">
        <button
          type="button"
          className="laporan-nav-box-btn"
          onClick={() => setActiveTab('today')}
        >
          <Flame size={16} className="text-amber-500" />
          <div className="nav-box-texts">
            <span className="nav-box-title">Buka Menu Today</span>
            <span className="nav-box-desc">Kelola 5 tugas prioritas hari ini</span>
          </div>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          className="laporan-nav-box-btn"
          onClick={() => setActiveTab('inbox')}
        >
          <Inbox size={16} className="text-blue-500" />
          <div className="nav-box-texts">
            <span className="nav-box-title">Buka Menu Inbox</span>
            <span className="nav-box-desc">Catat dan tinjau seluruh tugas</span>
          </div>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
