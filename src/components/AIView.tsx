'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import {
  sortTasksAnalysis,
  getUniversalAIConfig,
  UniversalAIConfig,
} from '../services/geminiService';
import { AISettingsModal } from './AISettingsModal';
import {
  Sparkles,
  Clock,
  Zap,
  Check,
  Calendar,
  Loader2,
  RotateCcw,
  Activity,
  ArrowRight,
  Star,
  TrendingUp,
  TrendingDown,
  MoveRight,
  Settings,
} from 'lucide-react';

export const AIView: React.FC = () => {
  const {
    tasks,
    aiAnalysis,
    isAnalyzingAI,
    runTaskAnalysis,
    setActiveTab,
    toggleTaskStatus,
    toggleTodayTask,
    showToast,
  } = useTask();

  const [filterLevel, setFilterLevel] = useState<'all' | 'segera' | 'nanti'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [configInfo, setConfigInfo] = useState<UniversalAIConfig>(getUniversalAIConfig());

  // Perbarui info config saat modal ditutup / disimpan
  const refreshConfig = () => {
    setConfigInfo(getUniversalAIConfig());
  };

  useEffect(() => {
    refreshConfig();
  }, []);

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

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const topTask = activeTasks.find((t) => t.id === aiAnalysis?.topPriorityTaskId) || activeTasks[0];

  // Seluruh item rekomendasi diurutkan rapi
  const sortedItems = useMemo(() => {
    if (!aiAnalysis?.tasksAnalysis) return [];
    return sortTasksAnalysis(aiAnalysis.tasksAnalysis, tasks);
  }, [aiAnalysis, tasks]);

  // Filter sederhana: Semua, Segera, Nanti
  const displayedItems = useMemo(() => {
    if (filterLevel === 'segera') {
      return sortedItems.filter((i) => i.urgencyLevel === 'Segera');
    }
    if (filterLevel === 'nanti') {
      return sortedItems.filter((i) => i.urgencyLevel === 'Nanti' || i.urgencyLevel === 'Rutin');
    }
    return sortedItems;
  }, [sortedItems, filterLevel]);

  const formatAnalyzedTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const countSegera = sortedItems.filter((i) => i.urgencyLevel === 'Segera').length;
  const countNanti = sortedItems.filter((i) => i.urgencyLevel === 'Nanti' || i.urgencyLevel === 'Rutin').length;

  // Render Badge Impak Task terhadap Goal Pengguna (Panah Menaik / Datar / Menurun)
  const renderGoalImpactBadge = (
    score?: number,
    impact?: 'Mendekatkan' | 'Netral' | 'Menjauhkan'
  ) => {
    if (score === undefined && !impact) return null;
    const numericScore = score ?? 50;
    const isUp = impact === 'Mendekatkan' || numericScore >= 65;
    const isDown = impact === 'Menjauhkan' || numericScore <= 35;

    let displayScore = '';
    if (isUp) {
      displayScore = `+${numericScore}%`;
    } else if (isDown) {
      displayScore = numericScore <= 0 ? `${numericScore}%` : `-${100 - numericScore}%`;
    } else {
      displayScore = `${numericScore}%`;
    }

    const tooltipText = isUp
      ? `Mendekatkan ke Goal (${displayScore})`
      : isDown
      ? `Menjauhkan dari Goal (${displayScore})`
      : `Dampak Netral (${displayScore})`;

    return (
      <span
        className={`ai-goal-impact-badge ${
          isUp ? 'impact-up' : isDown ? 'impact-down' : 'impact-flat'
        }`}
        title={tooltipText}
      >
        {isUp ? (
          <TrendingUp size={11} strokeWidth={2.5} />
        ) : isDown ? (
          <TrendingDown size={11} strokeWidth={2.5} />
        ) : (
          <MoveRight size={11} strokeWidth={2.5} />
        )}
        <span>{displayScore}</span>
      </span>
    );
  };

  return (
    <div className="ai-view-clean-container">
      {/* 1. Header Bersih dengan Icon Setting di Sebelah Judul */}
      <div className="ai-clean-header">
        <div className="ai-header-lead">
          <div className="ai-sparkle-icon-box">
            <Sparkles size={18} />
          </div>
          <div className="ai-header-texts">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="ai-clean-title">Asisten Cerdas</h2>
              <button
                type="button"
                className="ai-header-setting-icon-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="Pengaturan Model AI & Mode Offline"
                aria-label="Pengaturan Model AI & Mode Offline"
              >
                <Settings size={15} />
              </button>
            </div>
            <p className="ai-clean-subtitle">
              Saran prioritas dan ritme kerja yang selaras dengan hari Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Tindakan: Kiri = Timestamp Terakhir Diperbarui, Kanan = Tombol Perbarui Analisis */}
      <div className="ai-action-toolbar">
        <div className="ai-timestamp-box">
          <Clock size={13} className="updated-clock-icon" />
          <div className="ai-timestamp-texts">
            <span className="ai-timestamp-label">Terakhir diperbarui</span>
            <span className="ai-timestamp-value">
              {aiAnalysis ? (
                formatAnalyzedTime(aiAnalysis.analyzedAt) || aiAnalysis.currentTimeFormatted
              ) : (
                'Belum ada riwayat'
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="ai-btn-analyze"
          onClick={runTaskAnalysis}
          disabled={isAnalyzingAI}
          title="Perbarui rekomendasi analisis cerdas"
        >
          {isAnalyzingAI ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Menganalisis...</span>
            </>
          ) : aiAnalysis ? (
            <>
              <RotateCcw size={14} />
              <span>Perbarui Analisis</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Mulai Analisis</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Konten Hasil Analisis atau Tampilan Awal (Empty State) */}
      {!aiAnalysis ? (
        <div className="ai-empty-clean-card">
          <div className="empty-icon-circle">
            <Sparkles size={24} />
          </div>
          <h3 className="empty-title">Dapatkan Rekomendasi Fokus</h3>
          <p className="empty-desc">
            Asisten AI akan membaca daftar tugas Anda dan menyusun saran pengerjaan berdasarkan waktu terbaik dan tingkat energi saat ini.
          </p>
          <button
            type="button"
            className="ai-btn-start-large"
            onClick={runTaskAnalysis}
            disabled={isAnalyzingAI}
          >
            {isAnalyzingAI ? 'Sedang Memproses...' : 'Analisis Sekarang'}
          </button>
        </div>
      ) : (
        <div className="ai-content-sections">
          {/* A. Kartu Ringkasan Ritme Tubuh & Energi */}
          <div className="ai-card-ritme">
            <div className="ritme-card-header">
              <div className="ritme-badge">
                <div className="ritme-icon-dot">
                  <Activity size={13} />
                </div>
                <span className="ritme-title-text">Ritme Tubuh & Energi</span>
              </div>
              <div className="ritme-state-badge">
                <span className="ritme-state-dot" />
                <span className="ritme-state-text">{aiAnalysis.circadianState}</span>
              </div>
            </div>
            <p className="ritme-card-advice">{aiAnalysis.circadianAdvice}</p>
          </div>

          {/* B. Rekomendasi Prioritas Teratas Saat Ini */}
          {topTask && !topTask.isCompleted && (
            <div className="ai-card-top-focus">
              <div className="top-focus-header">
                <Zap size={14} className="text-amber" />
                <span className="top-focus-label">Fokus Disarankan Sekarang</span>
              </div>

              <div className="top-focus-body">
                <button
                  type="button"
                  className={`inbox-circle-checkbox ${topTask.isCompleted ? 'checked' : ''}`}
                  onClick={() => toggleTaskStatus(topTask.id)}
                  title="Tandai selesai"
                >
                  {topTask.isCompleted && <Check size={11} strokeWidth={3} />}
                </button>
                <div className="top-focus-info">
                  <span className="top-focus-task-title">{topTask.title}</span>
                  {topTask.dueDate && (
                    <div className="top-focus-meta">
                      <Clock size={11} />
                      <span>{formatReadableDate(topTask.dueDate)}</span>
                      {topTask.startTime && <span>• Jam {topTask.startTime}</span>}
                      {(() => {
                        const topAnalysis = aiAnalysis?.tasksAnalysis?.find((a) => a.taskId === topTask.id);
                        return topAnalysis
                          ? renderGoalImpactBadge(topAnalysis.goalAlignmentScore, topAnalysis.goalImpact)
                          : null;
                      })()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-open-top-task"
                  onClick={() => setActiveTab(topTask.isToday ? 'today' : 'inbox')}
                  title="Buka tugas"
                >
                  <span>Kerjakan</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* C. Rencana Tindakan Tugas (Daftar Baris Rapi & Minimalis) */}
          <div className="ai-plan-section">
            <div className="ai-plan-header">
              <h3 className="ai-plan-heading">Rencana Tindakan</h3>
              {/* Filter Tabs Bersih */}
              <div className="ai-clean-tabs">
                <button
                  type="button"
                  className={`ai-tab-chip ${filterLevel === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('all')}
                >
                  Semua ({sortedItems.length})
                </button>
                <button
                  type="button"
                  className={`ai-tab-chip ${filterLevel === 'segera' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('segera')}
                >
                  Segera ({countSegera})
                </button>
                <button
                  type="button"
                  className={`ai-tab-chip ${filterLevel === 'nanti' ? 'active' : ''}`}
                  onClick={() => setFilterLevel('nanti')}
                >
                  Nanti ({countNanti})
                </button>
              </div>
            </div>

            {/* Flat Row List */}
            <div className="ai-flat-rows-list">
              {displayedItems.map((item) => {
                const originalTask = tasks.find((t) => t.id === item.taskId);
                const isDone = originalTask?.isCompleted || false;
                const isSegera = item.urgencyLevel === 'Segera';

                return (
                  <div
                    key={item.taskId}
                    className={`ai-task-row ${isSegera ? 'row-segera' : ''} ${isDone ? 'completed' : ''}`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      className={`inbox-circle-checkbox ${isDone ? 'checked' : ''}`}
                      onClick={() => toggleTaskStatus(item.taskId)}
                      title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {isDone && <Check size={11} strokeWidth={3} />}
                    </button>

                    {/* Info Utama */}
                    <div className="ai-row-content">
                      <div className="ai-row-title-bar">
                        <span className={`ai-row-title ${isDone ? 'title-done' : ''}`}>
                          {item.taskTitle}
                        </span>
                        <span
                          className={`ai-urgency-pill ${
                            isSegera ? 'urgency-segera' : 'urgency-nanti'
                          }`}
                        >
                          {isSegera ? 'Segera' : 'Nanti'}
                        </span>
                      </div>

                      {/* Alasan AI Singkat */}
                      {item.reason && (
                        <p className="ai-row-reason">{item.reason}</p>
                      )}

                      {/* Baris Keterangan / Waktu Minimalis */}
                      <div className="ai-row-submeta">
                        {item.estimatedDuration && (
                          <span className="ai-submeta-item">
                            <Clock size={11} /> {item.estimatedDuration}
                          </span>
                        )}
                        {originalTask?.dueDate && (
                          <span className="ai-submeta-item">
                            <Calendar size={11} /> {formatReadableDate(originalTask.dueDate)}
                          </span>
                        )}
                        {renderGoalImpactBadge(item.goalAlignmentScore, item.goalImpact)}
                      </div>
                    </div>

                    {/* Aksi Tambah ke Today */}
                    {originalTask && !isDone && (
                      <button
                        type="button"
                        className={`ai-star-btn ${originalTask.isToday ? 'active' : ''}`}
                        onClick={() => toggleTodayTask(item.taskId)}
                        title={
                          originalTask.isToday
                            ? 'Keluarkan dari Today'
                            : 'Pilih masuk ke fokus Today'
                        }
                      >
                        <Star
                          size={15}
                          fill={originalTask.isToday ? '#f59e0b' : 'none'}
                          color={originalTask.isToday ? '#d97706' : '#94a3b8'}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Model & Kunci AI */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={refreshConfig}
        showToast={showToast}
      />
    </div>
  );
};
