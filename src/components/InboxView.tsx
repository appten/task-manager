'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { InboxTaskRow } from './InboxTaskRow';
import { TaskForm } from './TaskForm';
import { InboxType } from '../types/task';
import {
  Search,
  Plus,
  X,
  ClipboardCheck,
  Inbox as InboxIcon,
  CheckSquare,
  Calendar,
  Bell,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';

export const InboxView: React.FC = () => {
  const {
    tasks,
    searchQuery,
    setSearchQuery,
    isTaskFormOpen,
    setIsTaskFormOpen,
    addTask,
    showToast,
  } = useTask();

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickType, setQuickType] = useState<InboxType>('tugas');
  const [quickStartDateTime, setQuickStartDateTime] = useState('');
  const [quickEndDateTime, setQuickEndDateTime] = useState('');

  // Filter Kategori Tipe (Semua / Tugas / Acara / Pengingat)
  const [typeFilter, setTypeFilter] = useState<'all' | InboxType>('all');

  // Pada menu Inbox, hanya tampilkan tugas aktif (belum selesai)
  const activeTasks = tasks.filter((t) => !t.isCompleted);

  // Filter berdasarkan search query dan type filter
  const filteredTasks = activeTasks.filter((task) => {
    if (typeFilter !== 'all' && task.inboxType !== typeFilter) {
      return false;
    }

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
  const activeCount = activeTasks.length;

  const tugasCount = activeTasks.filter((t) => t.inboxType === 'tugas').length;
  const acaraCount = activeTasks.filter((t) => t.inboxType === 'kegiatan').length;
  const pengingatCount = activeTasks.filter((t) => t.inboxType === 'pengingat').length;

  // Handle Quick Add instan (Tekan Enter atau klik +)
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const todayDateStr = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    let startDate = todayDateStr;
    let startTime: string | undefined = undefined;
    let dueDate = todayDateStr;
    let dueTime: string | undefined = undefined;

    if (quickType === 'kegiatan') {
      if (quickStartDateTime) {
        const [sDate, sTime] = quickStartDateTime.split('T');
        if (sDate) startDate = sDate;
        if (sTime) startTime = sTime;
      }
      if (quickEndDateTime) {
        const [eDate, eTime] = quickEndDateTime.split('T');
        if (eDate) dueDate = eDate;
        if (eTime) dueTime = eTime;
      } else if (quickStartDateTime) {
        dueDate = startDate;
      }
    }

    addTask({
      title: quickTitle.trim(),
      inboxType: quickType,
      priority: 'medium',
      category: quickType === 'kegiatan' ? 'Pribadi' : 'Pekerjaan',
      dueDate,
      dueTime,
      startDate,
      startTime,
      endDate: dueDate,
      endTime: dueTime,
      isUserStartTimeFixed: Boolean(startTime),
      isUserEndTimeFixed: Boolean(dueTime),
      recurrence: 'none',
      isCompleted: false,
      subTasks: [],
    });

    setQuickTitle('');
    setQuickStartDateTime('');
    setQuickEndDateTime('');
    showToast(`"${quickTitle.trim()}" berhasil disimpan ke Inbox! 📥`);
  };

  return (
    <div className="inbox-view-container">
      {/* 1. Header Minimalis & Bersih */}
      <div className="inbox-clean-header">
        <div className="inbox-header-title-group">
          <div className="inbox-icon-accent">
            <InboxIcon size={18} />
          </div>
          <div>
            <h1 className="inbox-main-title">Inbox</h1>
            <p className="inbox-count-caption">
              {activeCount} aktif {totalCount > activeCount ? `• ${totalCount - activeCount} selesai` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`btn-toggle-detail-form ${isTaskFormOpen ? 'open' : ''}`}
          onClick={() => setIsTaskFormOpen(!isTaskFormOpen)}
          title={isTaskFormOpen ? 'Tutup Form Lengkap' : 'Buka Form dengan opsi detail & AI'}
        >
          {isTaskFormOpen ? (
            <>
              <X size={14} />
              <span>Tutup Form</span>
            </>
          ) : (
            <>
              <SlidersHorizontal size={13} />
              <span>Form Lengkap</span>
            </>
          )}
        </button>
      </div>

      {/* Form Lengkap Tambah Tugas (Opsional / Terbuka jika user butuh setting mendalam) */}
      {isTaskFormOpen && (
        <div className="inbox-form-wrapper">
          <TaskForm />
        </div>
      )}

      {/* 2. Quick-Add Bar (Cepat, Minimalis, Tanpa Distraksi) */}
      <form onSubmit={handleQuickAdd} className="inbox-quick-add-bar">
        {/* Type Selector Dropdown / Pill Toggle */}
        <div className="quick-type-selector">
          <button
            type="button"
            className={`type-chip ${quickType === 'tugas' ? 'selected' : ''}`}
            onClick={() => setQuickType('tugas')}
            title="Kategori: Tugas"
          >
            <CheckSquare size={12} />
            <span>Tugas</span>
          </button>
          <button
            type="button"
            className={`type-chip ${quickType === 'kegiatan' ? 'selected' : ''}`}
            onClick={() => setQuickType('kegiatan')}
            title="Kategori: Acara / Kegiatan"
          >
            <Calendar size={12} />
            <span>Acara</span>
          </button>
          <button
            type="button"
            className={`type-chip ${quickType === 'pengingat' ? 'selected' : ''}`}
            onClick={() => setQuickType('pengingat')}
            title="Kategori: Pengingat"
          >
            <Bell size={12} />
            <span>Pengingat</span>
          </button>
        </div>

        {/* Input Text Satu Baris */}
        <div className="quick-input-row">
          <input
            type="text"
            className="quick-add-input"
            placeholder={
              quickType === 'kegiatan'
                ? '+ Tulis nama kegiatan / acara baru lalu Enter...'
                : quickType === 'pengingat'
                ? '+ Tulis pengingat baru lalu Enter...'
                : '+ Tulis tugas baru lalu tekan Enter...'
            }
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
          />
          <button
            type="submit"
            className="btn-quick-submit"
            disabled={!quickTitle.trim()}
            title="Simpan ke Inbox (Enter)"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Acara/Kegiatan: Waktu Mulai & Selesai Opsional (Vertikal Rapi) */}
        {quickType === 'kegiatan' && (
          <div className="quick-event-datetime-panel">
            <div className="quick-event-fields-col">
              <div className="quick-time-field">
                <span className="quick-time-caption">
                  <Clock size={11} />
                  <span>Mulai:</span>
                </span>
                <input
                  type="datetime-local"
                  className="quick-datetime-input"
                  value={quickStartDateTime}
                  onChange={(e) => setQuickStartDateTime(e.target.value)}
                  title="Waktu mulai acara (opsional)"
                />
              </div>

              <div className="quick-time-field">
                <span className="quick-time-caption">
                  <Clock size={11} />
                  <span>Selesai:</span>
                </span>
                <input
                  type="datetime-local"
                  className="quick-datetime-input"
                  value={quickEndDateTime}
                  onChange={(e) => setQuickEndDateTime(e.target.value)}
                  title="Waktu selesai acara (opsional)"
                />
              </div>
            </div>
            <span className="quick-event-helper-text">
              Opsional: tentukan waktu mulai & selesai agar tersinkron otomatis ke jadwal kalender
            </span>
          </div>
        )}
      </form>

      {/* 3. Baris Pencarian & Filter Cepat (Clean & Subtle) */}
      <div className="inbox-controls-bar">
        {/* Search Input Bersih */}
        <div className="inbox-clean-search">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="clean-search-input"
            placeholder="Cari item di inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              Batal
            </button>
          )}
        </div>

        {/* Filter Chips Sederhana */}
        <div className="inbox-filter-chips">
          <button
            type="button"
            className={`chip-item ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Semua ({activeCount})
          </button>
          <button
            type="button"
            className={`chip-item ${typeFilter === 'tugas' ? 'active' : ''}`}
            onClick={() => setTypeFilter('tugas')}
          >
            Tugas ({tugasCount})
          </button>
          <button
            type="button"
            className={`chip-item ${typeFilter === 'kegiatan' ? 'active' : ''}`}
            onClick={() => setTypeFilter('kegiatan')}
          >
            Acara ({acaraCount})
          </button>
          <button
            type="button"
            className={`chip-item ${typeFilter === 'pengingat' ? 'active' : ''}`}
            onClick={() => setTypeFilter('pengingat')}
          >
            Pengingat ({pengingatCount})
          </button>
        </div>
      </div>

      {/* 4. List Tugas / Inbox (Unboxed Minimalist List) */}
      {filteredTasks.length > 0 ? (
        <div className="inbox-clean-list">
          {filteredTasks.map((task) => (
            <InboxTaskRow key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="inbox-empty-card">
          <div className="empty-icon-bubble">
            <ClipboardCheck size={26} />
          </div>
          <h3 className="empty-title">
            {searchQuery
              ? 'Item Tidak Ditemukan'
              : typeFilter !== 'all'
              ? `Tidak ada item ${typeFilter} aktif`
              : activeCount === 0 && totalCount > 0
              ? 'Semua Selesai! 🎉'
              : 'Inbox Bersih & Rapi'}
          </h3>
          <p className="empty-description">
            {searchQuery
              ? `Tidak ditemukan item yang cocok dengan "${searchQuery}".`
              : typeFilter !== 'all'
              ? `Belum ada item aktif untuk filter ini.`
              : activeCount === 0 && totalCount > 0
              ? 'Seluruh item aktif telah dituntaskan dan tersimpan rapi di Riwayat.'
              : 'Ketik ide, tugas, atau acara pada kolom di atas untuk langsung mencatat ke Inbox.'}
          </p>
        </div>
      )}
    </div>
  );
};
