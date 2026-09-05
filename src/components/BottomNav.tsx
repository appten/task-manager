'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { CheckSquare, PlusCircle, CalendarDays } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks } = useTask();

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <nav className="android-bottom-nav-container" aria-label="Menu Navigasi Android">
      {/* Menu 1: Task */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
        onClick={() => setActiveTab('tasks')}
        aria-label="Menu Tugas"
      >
        <div className="nav-icon-wrapper">
          <CheckSquare size={20} strokeWidth={activeTab === 'tasks' ? 2.4 : 2} />
        </div>
        <span className="android-nav-label">Tugas</span>
        {pendingCount > 0 && (
          <span className="android-nav-badge">{pendingCount}</span>
        )}
      </button>

      {/* Menu 2: New / Entry */}
      <button
        type="button"
        className={`android-nav-item ${activeTab === 'new' ? 'active' : ''}`}
        onClick={() => setActiveTab('new')}
        aria-label="Menu Tambah Tugas Baru"
      >
        <div className="nav-icon-wrapper">
          <PlusCircle size={22} strokeWidth={activeTab === 'new' ? 2.4 : 2} />
        </div>
        <span className="android-nav-label">Buat Baru</span>
      </button>

      {/* Menu 3: Calendar */}
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
