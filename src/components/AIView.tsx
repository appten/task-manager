'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { sortTasksAnalysis } from '../services/geminiService';
import { TaskAnalysisItem } from '../types/task';
import {
  Brain,
  Sparkles,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  Calendar,
  Sun,
  Inbox as InboxIcon,
  Loader2,
  RotateCcw,
  CheckSquare,
  Bell,
  Activity,
  ArrowRight,
  Repeat,
  Flame,
  Star,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Compass,
} from 'lucide-react';

export const AIView: React.FC = () => {
  const {
    tasks,
    todayTasks,
    aiAnalysis,
    isAnalyzingAI,
    runTaskAnalysis,
    setActiveTab,
    toggleTaskStatus,
    toggleTodayTask,
  } = useTask();

  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'segera' | 'rutin' | 'nanti'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'today' | 'inbox'>('all');
  const [isNantiExpanded, setIsNantiExpanded] = useState<boolean>(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const formatReadableDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const activeTodayCount = todayTasks.filter((t) => !t.isCompleted).length;
  const activeInboxCount = activeTasks.filter((t) => !t.isToday).length;

  const topTask = activeTasks.find((t) => t.id === aiAnalysis?.topPriorityTaskId) || activeTasks[0];

  // Selalu urutkan item: Segera > Rutin > Nanti
  const sortedAllItems = useMemo(() => {
    if (!aiAnalysis?.tasksAnalysis) return [];
    return sortTasksAnalysis(aiAnalysis.tasksAnalysis, tasks);
  }, [aiAnalysis, tasks]);

  // Filter berdasarkan sumber lokasi (Today vs Inbox)
  const sourceFilteredItems = useMemo(() => {
    return sortedAllItems.filter((item) => {
      const taskObj = tasks.find((t) => t.id === item.taskId);
      if (!taskObj) return false;
      if (sourceFilter === 'today') return taskObj.isToday;
      if (sourceFilter === 'inbox') return !taskObj.isToday;
      return true;
    });
  }, [sortedAllItems, tasks, sourceFilter]);

  // Kelompokkan per tingkat tindakan & urgensi
  const segeraItems = useMemo(
    () => sourceFilteredItems.filter((i) => i.urgencyLevel === 'Segera'),
    [sourceFilteredItems]
  );
  const rutinItems = useMemo(
    () => sourceFilteredItems.filter((i) => i.urgencyLevel === 'Rutin'),
    [sourceFilteredItems]
  );
  const nantiItems = useMemo(
    () => sourceFilteredItems.filter((i) => i.urgencyLevel === 'Nanti'),
    [sourceFilteredItems]
  );

  // Total counter untuk chips
  const totalSegera = useMemo(
    () => sortedAllItems.filter((i) => i.urgencyLevel === 'Segera').length,
    [sortedAllItems]
  );
  const totalRutin = useMemo(
    () => sortedAllItems.filter((i) => i.urgencyLevel === 'Rutin').length,
    [sortedAllItems]
  );
  const totalNanti = useMemo(
    () => sortedAllItems.filter((i) => i.urgencyLevel === 'Nanti').length,
    [sortedAllItems]
  );

  // Render Kartu Rekomendasi dengan Tombol Aksi Cepat
  const renderItemCard = (item: TaskAnalysisItem, rank?: number) => {
    const originalTask = tasks.find((t) => t.id === item.taskId);
    const dateLabel =
      item.dateContextLabel ||
      (originalTask?.dueDate ? formatReadableDate(originalTask.dueDate) : 'Hari ini');
    const hasTime =
      originalTask?.startTime || originalTask?.dueTime || originalTask?.endTime;
    const isDone = originalTask?.isCompleted || false;

    return (
      <div
        key={item.taskId}
        className={`breakdown-card ${
          item.urgencyLevel === 'Segera'
            ? 'card-segera'
            : item.urgencyLevel === 'Rutin'
            ? 'card-rutin'
            : 'card-nanti'
        } ${item.timeWindowStatus === 'locked_until_start' ? 'card-locked' : ''} ${
          isDone ? 'card-completed' : ''
        }`}
      >
        {/* Baris 1: Rank Badge (Segera) & Kategori */}
        <div className="breakdown-tag-header">
          <div className="breakdown-type-tags">
            {rank !== undefined && (
              <span className={`breakdown-rank-badge rank-${rank}`}>
                #{rank} Prioritas
              </span>
            )}
            {originalTask?.inboxType && (
              <span className={`meta-inbox-badge compact ${originalTask.inboxType}`}>
                {originalTask.inboxType === 'kegiatan' ? (
                  <>
                    <Calendar size={10} /> Acara
                  </>
                ) : originalTask.inboxType === 'pengingat' ? (
                  <>
                    <Bell size={10} /> Pengingat
                  </>
                ) : (
                  <>
                    <CheckSquare size={10} /> Tugas
                  </>
                )}
              </span>
            )}
            {originalTask?.isToday && (
              <span className="breakdown-today-tag">★ Di Today</span>
            )}
            {originalTask?.recurrence && originalTask.recurrence !== 'none' && (
              <span className="meta-recurrence-badge compact">
                <Repeat size={10} />{' '}
                {originalTask.recurrence === 'daily'
                  ? 'Harian'
                  : originalTask.recurrence === 'weekdays'
                  ? 'Sen-Jum'
                  : originalTask.recurrence === 'weekly'
                  ? 'Mingguan'
                  : 'Bulanan'}
              </span>
            )}
          </div>

          <span className={`urgency-badge ${item.urgencyLevel.toLowerCase()}`}>
            {item.urgencyLevel === 'Segera' ? (
              <>
                <Flame size={10} /> Segera
              </>
            ) : item.urgencyLevel === 'Rutin' ? (
              <>
                <Repeat size={10} /> Rutin
              </>
            ) : (
              <>
                <Clock size={10} /> Nanti
              </>
            )}
          </span>
        </div>

        {/* Baris 2: Judul Item */}
        <h4 className={`breakdown-task-title ${isDone ? 'title-completed' : ''}`}>
          {item.taskTitle}
        </h4>

        {/* Baris 3: Strip Waktu Terstruktur */}
        <div className="breakdown-time-strip">
          <div className="breakdown-time-info">
            <Calendar size={11} />
            <span className="time-date-text">{dateLabel}</span>
            {hasTime && (
              <span className="time-clock-text">
                • {originalTask?.startTime ? originalTask.startTime : 'Bebas'}
                {originalTask?.dueTime || originalTask?.endTime
                  ? ` - ${originalTask?.dueTime || originalTask?.endTime}`
                  : ''}
              </span>
            )}
          </div>
          {item.timeWindowStatus && (
            <span className={`time-window-badge ${item.timeWindowStatus}`}>
              {item.timeWindowStatus === 'locked_until_start'
                ? '🔒 '
                : item.timeWindowStatus === 'nearing_deadline'
                ? '⏰ '
                : '🟢 '}
              {item.timeWindowDescription || 'Siap'}
            </span>
          )}
        </div>

        {/* Baris 4: Penjelasan AI */}
        <p className="breakdown-reason">{item.reason}</p>

        {/* Baris 5: Meta Footer */}
        <div className="breakdown-meta-row">
          <span className="breakdown-meta-pill fit">⚡ {item.biologicalFit}</span>
          <span className="breakdown-meta-pill duration">
            ⏱️ {item.estimatedDuration} ({item.effortLevel})
          </span>
          {item.goalAlignmentScore !== undefined && (
            <span className="breakdown-meta-pill goal">
              🎯 Keselarasan: +{item.goalAlignmentScore}
            </span>
          )}
        </div>

        {/* Baris 6: Tombol Aksi Cepat 1-Klik (Pengguna Segera Bertindak) */}
        <div className="breakdown-action-bar">
          <button
            type="button"
            className={`btn-quick-action btn-action-done ${isDone ? 'completed' : ''}`}
            onClick={() => toggleTaskStatus(item.taskId)}
            title={isDone ? 'Batalkan status selesai' : 'Tandai selesai sekarang'}
          >
            <CheckCircle2 size={13} />
            <span>{isDone ? 'Selesai Dituntaskan' : 'Tandai Selesai'}</span>
          </button>

          {originalTask && !isDone && (() => {
            const todayDateStr = new Date().toISOString().slice(0, 10);
            const taskDate = originalTask.startDate || originalTask.dueDate;
            const isScheduledEventNotToday =
              originalTask.inboxType === 'kegiatan' &&
              Boolean(originalTask.startTime || originalTask.endTime || originalTask.dueTime) &&
              Boolean(taskDate && taskDate !== todayDateStr);

            return (
              <button
                type="button"
                className={`btn-quick-action btn-action-today ${
                  originalTask.isToday ? 'active' : ''
                } ${isScheduledEventNotToday ? 'disabled-event' : ''}`}
                onClick={() => toggleTodayTask(item.taskId)}
                title={
                  isScheduledEventNotToday
                    ? `Acara terjadwal untuk ${dateLabel} (hanya acara hari ini yang bisa masuk ke Today)`
                    : originalTask.isToday
                    ? 'Keluarkan dari 5 fokus Today'
                    : 'Pilih masuk ke 5 fokus Today'
                }
              >
                <Star
                  size={13}
                  className={
                    isScheduledEventNotToday
                      ? 'text-slate'
                      : originalTask.isToday
                      ? 'fill-amber text-amber'
                      : ''
                  }
                />
                <span>
                  {originalTask.isToday
                    ? 'Di Today'
                    : isScheduledEventNotToday
                    ? 'Terjadwal'
                    : '+ Fokus Today'}
                </span>
              </button>
            );
          })()}

          <button
            type="button"
            className="btn-quick-action btn-action-open"
            onClick={() => setActiveTab(originalTask?.isToday ? 'today' : 'inbox')}
            title={`Buka di ${originalTask?.isToday ? 'Today' : 'Inbox'}`}
          >
            <span>Kerjakan</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="ai-view-container">
      {/* 1. Header AI */}
      <div className="ai-view-header">
        <div className="ai-header-title-wrap">
          <div className="ai-logo-pill">
            <Sparkles size={16} />
            <span>AI Productivity Engine</span>
          </div>
          <h2 className="ai-view-heading">Analisis & Rekomendasi Cerdas</h2>
          <p className="ai-view-subheading">
            Menganalisis seluruh item Inbox & Today disesuaikan dengan energi dan waktu saat ini.
          </p>
        </div>

        {/* Live Clock Tag */}
        <div className="ai-live-clock-badge">
          <Clock size={13} />
          <span>
            Waktu Sekarang: <strong>{currentTimeStr || 'Memuat...'}</strong>
          </span>
        </div>
      </div>

      {/* 2. Hero Action Button */}
      <div className="ai-cta-card">
        <div className="ai-cta-info">
          <div className="ai-stat-chips">
            <span className="ai-stat-chip">
              <Sun size={12} /> Today: {activeTodayCount} tugas
            </span>
            <span className="ai-stat-chip">
              <InboxIcon size={12} /> Inbox: {activeInboxCount} item
            </span>
          </div>
        </div>

        <button
          type="button"
          className="ai-primary-action-btn"
          onClick={runTaskAnalysis}
          disabled={isAnalyzingAI}
        >
          {isAnalyzingAI ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Menganalisis Kondisi & Waktu Saat Ini...</span>
            </>
          ) : aiAnalysis ? (
            <>
              <RotateCcw size={18} />
              <span>Perbarui Analisis (Waktu Saat Ini)</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Mulai Analisis AI Lengkap</span>
            </>
          )}
        </button>

        <span className="ai-cta-helper">
          *Menyesuaikan jam biologis, urgensi, durasi usaha, dan tujuan hidup Anda.
        </span>
      </div>

      {/* 3. Hasil Analisis */}
      {aiAnalysis ? (
        <div className="ai-results-wrapper">
          {/* Card A: Jam Biologis & Ritme Sirkadian */}
          <div className="ai-insight-card circadian-insight">
            <div className="insight-card-header">
              <Activity size={17} className="text-violet" />
              <span className="insight-card-tag">Jam Biologis & Ritme Tubuh</span>
            </div>
            <div className="insight-card-title">{aiAnalysis.circadianState}</div>
            <p className="insight-card-body">{aiAnalysis.circadianAdvice}</p>
          </div>

          {/* Card B: Rekomendasi Terbaik Saat Ini */}
          {topTask && (
            <div className="ai-insight-card top-task-insight">
              <div className="insight-card-header">
                <Zap size={17} className="text-amber" />
                <span className="insight-card-tag">Rekomendasi Terbaik Saat Ini</span>
              </div>
              <div className="top-task-title-row">
                <h4 className="top-task-title">{topTask.title}</h4>
                <span className={`meta-item meta-inbox-badge ${topTask.inboxType || 'tugas'}`}>
                  {topTask.inboxType === 'kegiatan' ? (
                    <>
                      <Calendar size={10} /> Acara
                    </>
                  ) : topTask.inboxType === 'pengingat' ? (
                    <>
                      <Bell size={10} /> Pengingat
                    </>
                  ) : (
                    <>
                      <CheckSquare size={10} /> Tugas
                    </>
                  )}
                </span>
              </div>

              {/* Status Waktu & Jendela Tugas Utama */}
              {(() => {
                const topAnalysisItem = aiAnalysis.tasksAnalysis?.find(
                  (x) => x.taskId === topTask.id
                );
                const dateLabel =
                  topAnalysisItem?.dateContextLabel ||
                  (topTask.dueDate ? formatReadableDate(topTask.dueDate) : 'Hari ini');
                return (
                  <div className="top-task-window-status-box">
                    <div className="top-task-meta">
                      <Clock size={12} />
                      <span>
                        <strong>{dateLabel}</strong>
                        {topTask.startTime ? ` • Mulai ${topTask.startTime}` : ''}
                        {topTask.dueTime || topTask.endTime
                          ? ` - Batas ${topTask.dueTime || topTask.endTime}`
                          : ''}
                      </span>
                    </div>
                    {topAnalysisItem?.timeWindowDescription && (
                      <span
                        className={`time-window-badge ${
                          topAnalysisItem.timeWindowStatus || 'ready'
                        }`}
                      >
                        {topAnalysisItem.timeWindowStatus === 'locked_until_start'
                          ? '🔒 '
                          : topAnalysisItem.timeWindowStatus === 'nearing_deadline'
                          ? '⏰ '
                          : '🟢 '}
                        {topAnalysisItem.timeWindowDescription}
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="top-task-actions">
                <button
                  type="button"
                  className="btn-top-task-done"
                  onClick={() => toggleTaskStatus(topTask.id)}
                >
                  <CheckCircle2 size={14} /> Tandai Selesai
                </button>
                <button
                  type="button"
                  className="btn-top-task-goto"
                  onClick={() => setActiveTab(topTask.isToday ? 'today' : 'inbox')}
                >
                  Buka di {topTask.isToday ? 'Today' : 'Inbox'} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Card C: Ringkasan Strategi Produktivitas */}
          <div className="ai-insight-card summary-insight">
            <div className="insight-card-header">
              <Target size={17} className="text-sky" />
              <span className="insight-card-tag">Gambaran & Strategi Produktivitas</span>
            </div>
            <p className="insight-card-body">{aiAnalysis.overallSummary}</p>
            {aiAnalysis.userGoalContext && (
              <div className="user-goal-ref">
                🎯 <strong>Goal Pengguna:</strong> {aiAnalysis.userGoalContext}
              </div>
            )}
          </div>

          {/* Panduan Aksi Pengguna (Call-to-Action) */}
          <div className="ai-action-guide-banner">
            <div className="action-guide-icon">
              <Compass size={20} />
            </div>
            <div className="action-guide-content">
              <h5 className="action-guide-title">Langkah Anda Sekarang:</h5>
              <p className="action-guide-desc">
                Pilih tugas pada kelompok <strong>&quot;Segera Bertindak&quot;</strong> di bawah. Klik{' '}
                <strong>[Tandai Selesai]</strong> bila sudah tuntas, atau klik{' '}
                <strong>[+ Fokus Today]</strong> untuk menjadikannya target utama hari ini.
              </p>
            </div>
          </div>

          {/* 4. Rincian Analisis Terstruktur Berdasarkan Tingkat Urgensi */}
          <div className="ai-item-breakdown-section">
            <div className="breakdown-header-row">
              <div className="breakdown-header-title-wrap">
                <h3 className="breakdown-heading">Rencana Tindakan & Rekomendasi</h3>
                <span className="breakdown-total-badge">
                  {sourceFilteredItems.length} Item
                </span>
              </div>

              {/* Sub-Filter Lokasi (Today vs Inbox) */}
              <div className="breakdown-location-filters">
                <button
                  type="button"
                  className={`loc-filter-chip ${sourceFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSourceFilter('all')}
                >
                  Semua Lokasi
                </button>
                <button
                  type="button"
                  className={`loc-filter-chip ${sourceFilter === 'today' ? 'active' : ''}`}
                  onClick={() => setSourceFilter('today')}
                >
                  <Sun size={11} /> Today ({activeTodayCount})
                </button>
                <button
                  type="button"
                  className={`loc-filter-chip ${sourceFilter === 'inbox' ? 'active' : ''}`}
                  onClick={() => setSourceFilter('inbox')}
                >
                  <InboxIcon size={11} /> Inbox ({activeInboxCount})
                </button>
              </div>
            </div>

            {/* Filter Utama Berbasis Urgensi */}
            <div className="breakdown-urgency-tabs">
              <button
                type="button"
                className={`urgency-tab-btn ${urgencyFilter === 'all' ? 'active' : ''}`}
                onClick={() => setUrgencyFilter('all')}
              >
                Semua ({sortedAllItems.length})
              </button>
              <button
                type="button"
                className={`urgency-tab-btn segera ${urgencyFilter === 'segera' ? 'active' : ''}`}
                onClick={() => setUrgencyFilter('segera')}
              >
                <Flame size={12} /> Segera ({totalSegera})
              </button>
              <button
                type="button"
                className={`urgency-tab-btn rutin ${urgencyFilter === 'rutin' ? 'active' : ''}`}
                onClick={() => setUrgencyFilter('rutin')}
              >
                <Repeat size={12} /> Rutin ({totalRutin})
              </button>
              <button
                type="button"
                className={`urgency-tab-btn nanti ${urgencyFilter === 'nanti' ? 'active' : ''}`}
                onClick={() => setUrgencyFilter('nanti')}
              >
                <Clock size={12} /> Nanti ({totalNanti})
              </button>
            </div>

            {/* KELOMPOK 1: SEGERA BERTINDAK (PRIORITAS TINGGI) */}
            {(urgencyFilter === 'all' || urgencyFilter === 'segera') && (
              <div className="urgency-group-section group-segera">
                <div className="group-section-header">
                  <div className="group-header-left">
                    <span className="group-header-pill segera">
                      <Flame size={13} /> TINGKAT 1
                    </span>
                    <div>
                      <h4 className="group-header-title">
                        Segera Bertindak ({segeraItems.length})
                      </h4>
                      <p className="group-header-subtitle">
                        Mendesak, mendekati batas waktu, atau paling pas dieksekusi sekarang.
                      </p>
                    </div>
                  </div>
                </div>

                {segeraItems.length > 0 ? (
                  <div className="breakdown-list">
                    {segeraItems.map((item, idx) => renderItemCard(item, idx + 1))}
                  </div>
                ) : (
                  <div className="group-empty-box">
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span>Tidak ada tugas mendesak saat ini. Ritme Anda terjaga aman! ✨</span>
                  </div>
                )}
              </div>
            )}

            {/* KELOMPOK 2: RUTINITAS & FOKUS HARIAN */}
            {(urgencyFilter === 'all' || urgencyFilter === 'rutin') && (
              <div className="urgency-group-section group-rutin">
                <div className="group-section-header">
                  <div className="group-header-left">
                    <span className="group-header-pill rutin">
                      <Repeat size={13} /> TINGKAT 2
                    </span>
                    <div>
                      <h4 className="group-header-title">
                        Rutinitas & Fokus Harian ({rutinItems.length})
                      </h4>
                      <p className="group-header-subtitle">
                        Tugas berulang dan kebiasaan berkala untuk menjaga konsistensi harian.
                      </p>
                    </div>
                  </div>
                </div>

                {rutinItems.length > 0 ? (
                  <div className="breakdown-list">
                    {rutinItems.map((item) => renderItemCard(item))}
                  </div>
                ) : (
                  <div className="group-empty-box">
                    <span>Tidak ada tugas rutinitas yang perlu diproses pada filter ini.</span>
                  </div>
                )}
              </div>
            )}

            {/* KELOMPOK 3: BISA NANTI & TERJADWAL */}
            {(urgencyFilter === 'all' || urgencyFilter === 'nanti') && (
              <div className="urgency-group-section group-nanti">
                <div
                  className="group-section-header collapsible"
                  onClick={() => setIsNantiExpanded((prev) => !prev)}
                >
                  <div className="group-header-left">
                    <span className="group-header-pill nanti">
                      <Clock size={13} /> TINGKAT 3
                    </span>
                    <div>
                      <h4 className="group-header-title">
                        Bisa Nanti & Terjadwal ({nantiItems.length})
                      </h4>
                      <p className="group-header-subtitle">
                        Terjadwal di masa depan atau fleksibel. Aman diabaikan untuk saat ini.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-group-toggle"
                    aria-label="Buka tutup rincian nanti"
                  >
                    {isNantiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isNantiExpanded && (
                  <>
                    {nantiItems.length > 0 ? (
                      <div className="breakdown-list">
                        {nantiItems.map((item) => renderItemCard(item))}
                      </div>
                    ) : (
                      <div className="group-empty-box">
                        <span>Tidak ada tugas yang berstatus ditunda / nanti.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State Sebelum Menekan Tombol */
        <div className="ai-empty-placeholder">
          <div className="ai-empty-icon-wrap">
            <Brain size={36} />
          </div>
          <h3 className="ai-empty-title">Siap Menganalisis Hari Anda</h3>
          <p className="ai-empty-desc">
            Tekan tombol <strong>&quot;Mulai Analisis AI Lengkap&quot;</strong> di atas. AI akan membaca seluruh tugas di Inbox dan Today Anda, mencocokkannya dengan jam saat ini (<strong>{currentTimeStr}</strong>), dan menyusun hierarki tindakan Segera, Rutin, dan Nanti agar Anda dapat langsung bertindak.
          </p>
        </div>
      )}
    </div>
  );
};
