'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import {
  Brain,
  Clock,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCircle,
  Activity,
} from 'lucide-react';

export const AIAnalysisCard: React.FC = () => {
  const { aiAnalysis, isAnalyzingAI, runTaskAnalysis } = useTask();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!aiAnalysis) {
    return (
      <div className="ai-trigger-banner">
        <div className="ai-banner-left">
          <div className="ai-banner-icon">
            <Brain size={18} />
          </div>
          <div>
            <div className="ai-banner-title">Analisis Prioritas & Jam Biologis</div>
            <div className="ai-banner-desc">
              Cek tugas mana yang penting dikerjakan saat ini sesuai ritme tubuh Anda.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="ai-banner-btn"
          onClick={runTaskAnalysis}
          disabled={isAnalyzingAI}
        >
          {isAnalyzingAI ? (
            <>
              <Loader2 size={13} className="spin" />
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <Sparkles size={13} />
              <span>Analisis Sekarang</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Format date of last analysis
  const formatTimeAgo = () => {
    return aiAnalysis.currentTimeFormatted || 'Baru saja';
  };

  return (
    <div className="ai-card-wrapper">
      {/* Header Bar yang Ringkas */}
      <div className="ai-card-header" onClick={() => setIsExpanded((prev) => !prev)}>
        <div className="ai-header-info">
          <div className="ai-header-badge">
            <Brain size={14} />
            <span>AI Chrono-Productivity</span>
          </div>
          <div className="ai-card-main-title">
            {aiAnalysis.circadianState}
          </div>
          <div className="ai-card-time-tag">
            <Clock size={11} />
            <span>{formatTimeAgo()}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span style={{ color: '#0b57d0', fontWeight: 600 }}>Tersimpan di lokal</span>
          </div>
        </div>

        <div className="ai-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ai-refresh-btn"
            onClick={runTaskAnalysis}
            disabled={isAnalyzingAI}
            title="Perbarui analisis dengan tugas & jam saat ini"
          >
            {isAnalyzingAI ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <RotateCcw size={13} />
            )}
            <span>{isAnalyzingAI ? 'Update...' : 'Perbarui'}</span>
          </button>

          <button
            type="button"
            className="ai-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Sembunyikan detail' : 'Lihat detail'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Ringkasan Singkat Saat Ditutup */}
      {!isExpanded && (
        <div
          className="ai-collapsed-summary"
          onClick={() => setIsExpanded(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} color="#b06000" />
            <span style={{ fontWeight: 600, color: '#1f1f1f' }}>Rekomendasi Utama:</span>
          </div>
          <p style={{ marginTop: '2px', color: '#444746', fontSize: '12px', lineHeight: 1.35 }}>
            {aiAnalysis.overallSummary}
          </p>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#0b57d0', fontWeight: 600 }}>
            Sentuh untuk lihat rincian estimasi usaha & waktu per tugas ▾
          </div>
        </div>
      )}

      {/* Detail Lengkap Analisis Saat Dibuka */}
      {isExpanded && (
        <div className="ai-expanded-content">
          {/* Section 1: Kondisi Jam Biologis Tubuh */}
          <div className="ai-section-box circadian-box">
            <div className="ai-section-label">
              <Activity size={13} color="#0b57d0" />
              <span>Jam Biologis Tubuh Saat Ini</span>
            </div>
            <div className="circadian-state-title">
              {aiAnalysis.circadianState}
            </div>
            <p className="circadian-advice-text">
              {aiAnalysis.circadianAdvice}
            </p>
          </div>

          {/* Section 2: Ringkasan Strategi Keseluruhan */}
          <div className="ai-section-box strategy-box">
            <div className="ai-section-label">
              <Target size={13} color="#b3261e" />
              <span>Rekomendasi Strategi Prioritas</span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.4 }}>
              {aiAnalysis.overallSummary}
            </p>
          </div>

          {/* Section 3: Rincian Analisis Per Tugas */}
          <div className="ai-tasks-breakdown">
            <div className="ai-section-label" style={{ marginBottom: '8px' }}>
              <CheckCircle size={13} color="#15803d" />
              <span>Daftar Tugas: Usaha, Waktu & Kesesuaian Biologis</span>
            </div>

            <div className="ai-task-item-list">
              {aiAnalysis.tasksAnalysis.map((item, idx) => {
                const isTop = item.taskId === aiAnalysis.topPriorityTaskId;
                const effortColor =
                  item.effortLevel === 'Tinggi'
                    ? '#b3261e'
                    : item.effortLevel === 'Sedang'
                    ? '#b06000'
                    : '#15803d';

                const effortBg =
                  item.effortLevel === 'Tinggi'
                    ? '#fce8e6'
                    : item.effortLevel === 'Sedang'
                    ? '#fef7e0'
                    : '#e6f4ea';

                return (
                  <div
                    key={item.taskId || idx}
                    className={`ai-task-card ${isTop ? 'top-priority' : ''}`}
                  >
                    {isTop && (
                      <div className="top-priority-banner">
                        ⭐ Tugas Prioritas Utama Sekarang
                      </div>
                    )}

                    <div className="ai-task-header-row">
                      <div className="ai-task-title">{item.taskTitle}</div>
                      <span
                        className="ai-urgency-badge"
                        style={{
                          background: item.urgencyLevel === 'Segera' ? '#fee2e2' : '#f1f5f9',
                          color: item.urgencyLevel === 'Segera' ? '#b91c1c' : '#475569',
                        }}
                      >
                        {item.urgencyLevel === 'Segera' ? '🔥 Segera' : 'Nanti'}
                      </span>
                    </div>

                    {/* Metadata: Usaha & Estimasi Waktu */}
                    <div className="ai-task-metrics">
                      <div className="metric-chip">
                        <span>Usaha:</span>
                        <strong style={{ color: effortColor, background: effortBg, padding: '1px 5px', borderRadius: '4px' }}>
                          {item.effortLevel}
                        </strong>
                      </div>

                      <div className="metric-chip">
                        <span>Estimasi:</span>
                        <strong style={{ color: '#1f1f1f' }}>
                          ⏱️ {item.estimatedDuration}
                        </strong>
                      </div>
                    </div>

                    {/* Kesesuaian Jam Biologis */}
                    <div className="ai-biological-fit">
                      <span style={{ fontWeight: 600 }}>🧬 Jam Biologis:</span>{' '}
                      <span>{item.biologicalFit}</span>
                    </div>

                    {/* Alasan AI */}
                    <div className="ai-reason-text">
                      💡 {item.reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              type="button"
              className="ai-collapse-text-btn"
              onClick={() => setIsExpanded(false)}
            >
              Sembunyikan Rincian Analisis ▲
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
