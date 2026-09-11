'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { Inbox, Sun, CalendarDays, Sparkles, User, Star } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks, todayTasks } = useTask();

  const inboxPendingCount = tasks.filter((t) => !t.isCompleted).length;
  const todayActiveCount = todayTasks.filter((t) => !t.isCompleted).length;

  return (
    <nav className="android-bottom-nav-container five-tabs" aria-label="Menu Navigasi Utama">
      {/* 1. Menu Inbox */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
        onClick={() => setActiveTab('inbox')}
        aria-label="Menu Inbox"
      >
        <div className="nav-icon-wrapper">
          <Inbox size={19} strokeWidth={activeTab === 'inbox' ? 2.4 : 1.8} />
        </div>
        <span className="android-nav-label">Inbox</span>
        {inboxPendingCount > 0 && (
          <span className="android-nav-badge">{inboxPendingCount}</span>
        )}
      </button>

      {/* 2. Menu AI (Di kanan Inbox) */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'ai' ? 'active' : ''}`}
        onClick={() => setActiveTab('ai')}
        aria-label="Menu AI Analisis & Rekomendasi"
      >
        <div className="nav-icon-wrapper ai-nav-icon">
          <Sparkles size={19} strokeWidth={activeTab === 'ai' ? 2.4 : 1.8} />
        </div>
        <span className="android-nav-label">AI</span>
      </button>

      {/* 3. Menu Today (Dibuat Lebih Menonjol di Tengah) */}
      <button
        type="button"
        className={`android-nav-item today-nav-highlight ${activeTab === 'today' ? 'active' : ''}`}
        onClick={() => setActiveTab('today')}
        aria-label="Menu Today - 5 Tugas Fokus"
      >
        <div className="today-highlight-icon-wrapper">
          <Star size={18} fill={activeTab === 'today' ? '#ffffff' : '#fef08a'} strokeWidth={2.4} />
          {todayTasks.length > 0 && (
            <span className="today-floating-badge">{todayTasks.length}/5</span>
          )}
        </div>
        <span className="android-nav-label today-label">Today</span>
      </button>

      {/* 4. Menu Kalender (Di kanan Today) */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => setActiveTab('calendar')}
        aria-label="Menu Kalender"
      >
        <div className="nav-icon-wrapper">
          <CalendarDays size={19} strokeWidth={activeTab === 'calendar' ? 2.4 : 1.8} />
        </div>
        <span className="android-nav-label">Kalender</span>
      </button>

      {/* 5. Menu Akun (Di kanan Kalender) */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => setActiveTab('account')}
        aria-label="Menu Akun"
      >
        <div className="nav-icon-wrapper">
          <User size={19} strokeWidth={activeTab === 'account' ? 2.4 : 1.8} />
        </div>
        <span className="android-nav-label">Akun</span>
      </button>
    </nav>
  );
};
