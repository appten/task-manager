'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { Inbox, Sun, CalendarDays } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks, todayTasks } = useTask();

  const inboxPendingCount = tasks.filter((t) => !t.isCompleted).length;
  const todayActiveCount = todayTasks.filter((t) => !t.isCompleted).length;

  return (
    <nav className="android-bottom-nav-container" aria-label="Menu Navigasi Android">
      {/* Menu 1: Inbox */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
        onClick={() => setActiveTab('inbox')}
        aria-label="Menu Inbox Tugas"
      >
        <div className="nav-icon-wrapper">
          <Inbox size={21} strokeWidth={activeTab === 'inbox' ? 2.4 : 2} />
        </div>
        <span className="android-nav-label">Inbox</span>
        {inboxPendingCount > 0 && (
          <span className="android-nav-badge">{inboxPendingCount}</span>
        )}
      </button>

      {/* Menu 2: Today (5 List Tugas Terpilih) */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'today' ? 'active' : ''}`}
        onClick={() => setActiveTab('today')}
        aria-label="Menu Today 5 Tugas Pilihan"
      >
        <div className="nav-icon-wrapper">
          <Sun size={21} strokeWidth={activeTab === 'today' ? 2.4 : 2} />
        </div>
        <span className="android-nav-label">Today</span>
        <span className="android-nav-badge today-badge">
          {todayTasks.length}/5
        </span>
      </button>

      {/* Menu 3: Kalender */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => setActiveTab('calendar')}
        aria-label="Menu Kalender"
      >
        <div className="nav-icon-wrapper">
          <CalendarDays size={20} strokeWidth={activeTab === 'calendar' ? 2.4 : 2} />
        </div>
        <span className="android-nav-label">Kalender</span>
      </button>
    </nav>
  );
};
