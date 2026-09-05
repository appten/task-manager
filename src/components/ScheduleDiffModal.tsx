'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  RotateCcw,
  Check,
  Clock,
  Coffee,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { ScheduleComparisonResult } from '../types/task';
import { useTask } from '../context/TaskContext';

interface ScheduleDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: ScheduleComparisonResult | null;
  onRefresh: () => void;
}

export const ScheduleDiffModal: React.FC<ScheduleDiffModalProps> = ({
  isOpen,
  onClose,
  comparison,
  onRefresh,
}) => {
  const { applyAiSchedule, revertToOriginal, activeScheduleModes } = useTask();
  const [activeTab, setActiveTab] = useState<'compare' | 'before' | 'after'>('compare');

  if (!isOpen || !comparison) return null;

  const { dateStr, diffs, summary } = comparison;
  const isAiCurrentlyActive = activeScheduleModes[dateStr] === 'ai';

  const handleApply = () => {
    applyAiSchedule(dateStr);
    onClose();
  };

  const handleRevert = () => {
    revertToOriginal(dateStr);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container schedule-diff-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Bandingkan Jadwal AI
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                Sebelum (Asli) vs Sesudah (Rekomendasi AI) &bull; {dateStr}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary Metric Chips */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            borderBottom: '1px solid #d1fae5',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className="diff-summary-pill pill-blue">
              <Clock size={11} />
              {summary.rescheduledCount} Jam Disesuaikan
            </span>
            <span className="diff-summary-pill pill-green">
              <Coffee size={11} />
              {summary.breaksAddedCount} Jeda Istirahat
            </span>
            {summary.splitCount > 0 && (
              <span className="diff-summary-pill pill-purple">
                <Layers size={11} />
                {summary.splitCount} Sesi Terbagi
              </span>
            )}
            <span className="diff-summary-pill pill-teal">
              <ShieldCheck size={11} />
              100% Patuh Mulai & Selesai
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#047857', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Coffee size={12} style={{ flexShrink: 0 }} />
            <span>{summary.energyProtectionNote}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
          <div className="diff-tab-group">
            <button
              type="button"
              className={`diff-tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              ⚖️ Komparasi Sebelum & Sesudah
            </button>
            <button
              type="button"
              className={`diff-tab-btn ${activeTab === 'before' ? 'active' : ''}`}
              onClick={() => setActiveTab('before')}
            >
              📋 Sebelum (Asli)
            </button>
            <button
              type="button"
              className={`diff-tab-btn ${activeTab === 'after' ? 'active' : ''}`}
              onClick={() => setActiveTab('after')}
            >
              ⚡ Sesudah (AI)
            </button>
          </div>
        </div>

        {/* Diff Items Content List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {diffs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
              <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>
                Tidak ada tugas pada tanggal ini.
              </p>
            </div>
          ) : (
            diffs.map((diff, idx) => {
              if (activeTab === 'before' && diff.changeType === 'added_break') {
                return null;
              }

              return (
                <div
                  key={`${diff.taskId}-${idx}`}
                  className={`diff-card ${
                    diff.changeType === 'added_break'
                      ? 'diff-card-break'
                      : diff.changeType === 'rescheduled'
                      ? 'diff-card-rescheduled'
                      : diff.changeType === 'split'
                      ? 'diff-card-split'
                      : 'diff-card-unchanged'
                  }`}
                >
                  <div className="diff-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="diff-task-title">{diff.taskTitle}</span>
                      <span className="diff-category-tag">{diff.category}</span>
                    </div>

                    {/* Change Badge */}
                    {diff.changeType === 'added_break' && (
                      <span className="diff-badge badge-break">
                        <Coffee size={10} /> + Istirahat Baru
                      </span>
                    )}
                    {diff.changeType === 'rescheduled' && (
                      <span className="diff-badge badge-rescheduled">
                        <Clock size={10} /> Jam Diatur Ulang
                      </span>
                    )}
                    {diff.changeType === 'split' && (
                      <span className="diff-badge badge-split">
                        <Layers size={10} /> Sesi Terbagi
                      </span>
                    )}
                    {diff.changeType === 'unchanged' && (
                      <span className="diff-badge badge-unchanged">
                        <Check size={10} /> Jadwal Tetap
                      </span>
                    )}
                  </div>

                  {/* Mode Komparasi: Tampilkan Sebelum vs Sesudah */}
                  {activeTab === 'compare' && (
                    <div className="diff-compare-row">
                      {/* Box Sebelum */}
                      <div className="diff-time-box before-box">
                        <span className="box-label">Sebelum (Asli):</span>
                        <span className="box-time">{diff.beforeTime || 'Belum ada jam'}</span>
                        {diff.beforeWindow && (
                          <span className="box-sub">Batas: {diff.beforeWindow}</span>
                        )}
                      </div>

                      <ArrowRight size={14} className="diff-arrow" />

                      {/* Box Sesudah */}
                      <div className="diff-time-box after-box">
                        <span className="box-label">Sesudah (Rekomendasi AI):</span>
                        <span className="box-time">{diff.afterTime}</span>
                        {diff.afterSessions && diff.afterSessions.length > 1 && (
                          <span className="box-sub">{diff.afterSessions.length} sesi terbagi</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mode Tab Sebelum Saja */}
                  {activeTab === 'before' && (
                    <div className="diff-single-row">
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Waktu Asli:</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {diff.beforeTime}
                      </span>
                      {diff.beforeWindow && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({diff.beforeWindow})</span>
                      )}
                    </div>
                  )}

                  {/* Mode Tab Sesudah Saja */}
                  {activeTab === 'after' && (
                    <div className="diff-single-row">
                      <span style={{ fontSize: '11px', color: '#059669' }}>Rekomendasi AI:</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46' }}>
                        {diff.afterTime}
                      </span>
                    </div>
                  )}

                  {/* Catatan Alasan AI */}
                  {diff.reason && (
                    <div className="diff-reason-row">
                      <AlertCircle size={11} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{diff.reason}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Action Buttons */}
        <div
          className="modal-footer"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onRefresh}
              title="Hitung ulang rekomendasi AI dengan data terkini"
              style={{
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <RotateCcw size={13} />
              <span>Perbarui AI</span>
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleRevert}
              title="Kembalikan susunan tugas ke jadwal asli sebelum optimasi AI"
              style={{
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#64748b',
              }}
            >
              <span>↩️ Ke Asli</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '8px' }}
            >
              Tutup
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleApply}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{isAiCurrentlyActive ? 'Terapkan Ulang' : 'Terapkan Jadwal AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
