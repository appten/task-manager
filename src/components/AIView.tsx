'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
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
  } = useTask();

  const [filterType, setFilterType] = useState<'all' | 'today' | 'inbox'>('all');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

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

  const filteredAnalysisList = (aiAnalysis?.tasksAnalysis || []).filter((item) => {
    const taskObj = tasks.find((t) => t.id === item.taskId);
    if (!taskObj) return false;
    if (filterType === 'today') return taskObj.isToday;
    if (filterType === 'inbox') return !taskObj.isToday;
    return true;
  });

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
          <span>Waktu Sekarang: <strong>{currentTimeStr || 'Memuat...'}</strong></span>
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

          {/* Card B: Tugas Utama yang Direkomendasikan Dikerjakan Sekarang */}
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
              {topTask.dueDate && (
                <div className="top-task-meta">
                  <Calendar size={11} /> Tenggat: {topTask.dueDate} {topTask.dueTime || ''}
                </div>
              )}
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

          {/* 4. Rincian Analisis Semua Item */}
          <div className="ai-item-breakdown-section">
            <div className="breakdown-header-row">
              <h3 className="breakdown-heading">
                Rincian Item Teranalisis ({filteredAnalysisList.length})
              </h3>

              {/* Filter Tabs */}
              <div className="breakdown-filter-chips">
                <button
                  type="button"
                  className={`breakdown-chip ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`breakdown-chip ${filterType === 'today' ? 'active' : ''}`}
                  onClick={() => setFilterType('today')}
                >
                  Today ({activeTodayCount})
                </button>
                <button
                  type="button"
                  className={`breakdown-chip ${filterType === 'inbox' ? 'active' : ''}`}
                  onClick={() => setFilterType('inbox')}
                >
                  Inbox ({activeInboxCount})
                </button>
              </div>
            </div>

            <div className="breakdown-list">
              {filteredAnalysisList.map((item) => {
                const originalTask = tasks.find((t) => t.id === item.taskId);
                return (
                  <div key={item.taskId} className="breakdown-card">
                    <div className="breakdown-card-top">
                      <div className="breakdown-title-wrap">
                        <span className="breakdown-task-title">{item.taskTitle}</span>
                        {originalTask?.isToday && (
                          <span className="breakdown-today-tag">★ Di Today</span>
                        )}
                      </div>
                      <span className={`urgency-badge ${item.urgencyLevel.toLowerCase()}`}>
                        {item.urgencyLevel}
                      </span>
                    </div>

                    <p className="breakdown-reason">{item.reason}</p>

                    <div className="breakdown-meta-row">
                      <span className="breakdown-meta-pill fit">
                        ⚡ {item.biologicalFit}
                      </span>
                      <span className="breakdown-meta-pill duration">
                        ⏱️ {item.estimatedDuration} ({item.effortLevel})
                      </span>
                      {item.goalAlignmentScore !== undefined && (
                        <span className="breakdown-meta-pill goal">
                          🎯 Keselarasan: +{item.goalAlignmentScore}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
            Tekan tombol <strong>"Mulai Analisis AI Lengkap"</strong> di atas. AI akan membaca seluruh tugas di Inbox dan Today Anda, mencocokkannya dengan jam saat ini (<strong>{currentTimeStr}</strong>), dan memberikan rekomendasi aksi terbaik.
          </p>
        </div>
      )}
    </div>
  );
};
