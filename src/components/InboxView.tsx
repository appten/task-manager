'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import {
  Search,
  Plus,
  X,
  ClipboardCheck,
  Inbox as InboxIcon,
} from 'lucide-react';

export const InboxView: React.FC = () => {
  const {
    tasks,
    todayTasks,
    searchQuery,
    setSearchQuery,
    isTaskFormOpen,
    setIsTaskFormOpen,
  } = useTask();

  // Pada menu Inbox, hanya tampilkan tugas aktif (belum selesai)
  // Tugas yang selesai otomatis berpindah ke halaman Riwayat Tugas
  const activeTasks = tasks.filter((t) => !t.isCompleted);

  const filteredTasks = activeTasks.filter((task) => {
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
  const activeCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="inbox-view-container">
      {/* 1. Header & Tombol Tambah Inbox */}
      <div className="inbox-quick-header">
        <div className="inbox-stats-summary">
          <div className="inbox-title-wrap">
            <InboxIcon size={20} className="inbox-main-icon" />
            <div>
              <h2 className="inbox-heading">Inbox</h2>
              <p className="inbox-subheading">
                {activeCount} item aktif ({totalCount} total)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`btn-toggle-task-form ${isTaskFormOpen ? 'open' : ''}`}
          onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}
          aria-expanded={isTaskFormOpen}
        >
          {isTaskFormOpen ? (
            <>
              <X size={16} />
              <span>Tutup Form</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>+ Tambah Inbox</span>
            </>
          )}
        </button>
      </div>

      {/* Form Tambah Inbox Langsung di Inbox */}
      {isTaskFormOpen && (
        <div className="inbox-form-wrapper">
          <TaskForm />
        </div>
      )}

      {/* 2. Fitur Cari (Search Bar) */}
      <div className="android-search-bar">
        <Search size={18} color="#747775" />
        <input
          type="text"
          className="android-search-input"
          placeholder="Cari di inbox (acara, tugas, pengingat)..."
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

      {/* 3. List Tugas / Inbox */}
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
            {searchQuery
              ? 'Item Tidak Ditemukan'
              : activeCount === 0 && totalCount > 0
              ? 'Semua Tugas Selesai! 🎉'
              : 'Inbox Kosong'}
          </div>
          <p className="empty-desc">
            {searchQuery
              ? `Tidak ada item inbox aktif yang cocok dengan kata kunci "${searchQuery}".`
              : activeCount === 0 && totalCount > 0
              ? 'Semua item aktif di Inbox telah selesai dan tersimpan rapi di menu Riwayat.'
              : 'Belum ada item di Inbox. Klik "+ Tambah Inbox" untuk membuat kegiatan/acara, tugas, atau pengingat baru.'}
          </p>
          {!isTaskFormOpen && (
            <button
              type="button"
              className="btn-primary"
              style={{ maxWidth: '180px', marginTop: '16px', padding: '10px' }}
              onClick={() => setIsTaskFormOpen(true)}
            >
              + Tambah Inbox
            </button>
          )}
        </div>
      )}
    </div>
  );
};
