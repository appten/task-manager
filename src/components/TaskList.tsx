'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { AIAnalysisCard } from './AIAnalysisCard';
import { Search, ListFilter, ClipboardCheck, Sparkles } from 'lucide-react';
import { FilterStatus, Category } from '../types/task';

const CATEGORIES: ('all' | Category)[] = [
  'all',
  'Pekerjaan',
  'Pribadi',
  'Belajar',
  'Kesehatan',
  'Lainnya',
];

export const TaskList: React.FC = () => {
  const {
    tasks,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setActiveTab,
  } = useTask();

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    // 1. Status filter
    if (filterStatus === 'active' && task.isCompleted) return false;
    if (filterStatus === 'completed' && !task.isCompleted) return false;

    // 2. Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchSub = task.subTasks.some((st) => st.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchSub) return false;
    }

    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div>
      {/* Search Bar Android Style */}
      <div className="android-search-bar">
        <Search size={18} color="#747775" />
        <input
          type="text"
          className="android-search-input"
          placeholder="Cari tugas atau sub-task..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#747775',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Batal
          </button>
        )}
      </div>

      {/* Status Filter Chips (Semua, Aktif, Selesai) */}
      <div className="filter-scroll-container">
        <button
          className={`material-chip ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Semua ({totalCount})
        </button>
        <button
          className={`material-chip ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Aktif ({totalCount - completedCount})
        </button>
        <button
          className={`material-chip ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          Selesai ({completedCount})
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="filter-scroll-container" style={{ marginBottom: '8px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`material-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ fontSize: '11px', padding: '3px 10px' }}
          >
            {cat === 'all' ? '🏷️ Semua' : cat}
          </button>
        ))}
      </div>

      {/* Fitur Analisis AI Produktivitas & Jam Biologis (1-Click & Saved Locally) */}
      <AIAnalysisCard />

      {/* Task List Items */}
      {filteredTasks.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon-circle">
            <ClipboardCheck size={28} />
          </div>
          <div className="empty-title">
            {tasks.length === 0 ? 'Belum ada task' : 'Tidak ditemukan task'}
          </div>
          <p className="empty-desc">
            {tasks.length === 0
              ? 'Mulai atur hari produktifmu dengan membuat task pertama.'
              : 'Coba ubah kata kunci pencarian atau filter status.'}
          </p>
          {tasks.length === 0 && (
            <button
              type="button"
              className="btn-primary"
              style={{ maxWidth: '180px', marginTop: '16px', padding: '10px' }}
              onClick={() => setActiveTab('new')}
            >
              + Buat Task Baru
            </button>
          )}
        </div>
      )}
    </div>
  );
};
