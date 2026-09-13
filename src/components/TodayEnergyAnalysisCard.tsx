'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { Task } from '../types/task';
import {
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  Play,
  Flame,
  Award,
} from 'lucide-react';

export const TodayEnergyAnalysisCard: React.FC = () => {
  const { todayTasks, setViewingTask, startTaskTimer, showToast } = useTask();
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());

  useEffect(() => {
    const updateTime = () => setCurrentHour(new Date().getHours());
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => !t.isCompleted);
  }, [todayTasks]);

  // Evaluasi ritme sirkadian & tugas Today terbaik yang cocok dikerjakan saat ini
  const analysis = useMemo(() => {
    let phaseLabel = 'Puncak Kognitif';
    let energyBadge = '⚡ Energi Prima (Pagi)';
    let energyLevel: 'high' | 'medium' | 'low' = 'high';
    let strategyAdvice = 'Waktu terbaik untuk tugas terberat atau yang membutuhkan konsentrasi analitis.';

    if (currentHour >= 5 && currentHour < 11) {
      phaseLabel = 'Puncak Kognitif & Logika';
      energyBadge = '⚡ Energi 90% (Pagi Prima)';
      energyLevel = 'high';
      strategyAdvice = 'Otak fresh & minim distraksi. Selesaikan tugas dengan bobot prioritas tertinggi sekarang.';
    } else if (currentHour >= 11 && currentHour < 14) {
      phaseLabel = 'Transisi Energi & Istirahat';
      energyBadge = '🔋 Energi 65% (Siang Transisi)';
      energyLevel = 'medium';
      strategyAdvice = 'Ritme biologis menurun pasca-makan. Cocok untuk tugas moderat, follow-up, atau perapian catatan.';
    } else if (currentHour >= 14 && currentHour < 18) {
      phaseLabel = 'Puncak Ketahanan & Eksekusi';
      energyBadge = '⚡ Energi 80% (Sore Eksekusi)';
      energyLevel = 'high';
      strategyAdvice = 'Fokus motorik dan ketahanan kerja kembali optimal. Tuntaskan tugas eksekusi aktif.';
    } else {
      phaseLabel = 'Mode Evaluasi & Penutupan';
      energyBadge = '🌙 Energi Menurun (Malam)';
      energyLevel = 'low';
      strategyAdvice = 'Fokus mulai lelah. Tuntaskan sub-tugas kecil yang tersisa atau evaluasi pencapaian hari ini.';
    }

    if (activeTodayTasks.length === 0) {
      return {
        phaseLabel,
        energyBadge,
        energyLevel,
        strategyAdvice,
        recommendedTask: null,
        reason: 'Semua tugas Today telah selesai atau belum ada tugas yang dimasukkan ke Today.',
      };
    }

    // Cari tugas paling cocok berdasarkan prioritas dan jam
    let bestTask: Task = activeTodayTasks[0];

    if (energyLevel === 'high') {
      // Prioritaskan tugas P1 (high) atau yang ada estimasi waktu
      const highPrio = activeTodayTasks.find((t) => t.priority === 'high');
      if (highPrio) bestTask = highPrio;
    } else if (energyLevel === 'medium') {
      // Prioritaskan tugas medium atau yang memiliki sub-tugas ringan
      const medPrio = activeTodayTasks.find((t) => t.priority === 'medium');
      if (medPrio) bestTask = medPrio;
    } else {
      // Malam hari: pilih tugas yang durasinya paling singkat atau low priority
      const lowOrShort = activeTodayTasks.find(
        (t) => t.priority === 'low' || (t.subTasks && t.subTasks.length <= 2)
      );
      if (lowOrShort) bestTask = lowOrShort;
    }

    const reason =
      energyLevel === 'high'
        ? `Tugas "${bestTask.title}" berbobot penting. Energi Anda saat ini sangat prima untuk menyelesaikannya secara tuntas.`
        : energyLevel === 'medium'
        ? `Tugas "${bestTask.title}" cocok dikerjakan di fase siang ini untuk menjaga ritme kerja tanpa memicu kelelahan.`
        : `Tugas "${bestTask.title}" ideal diselesaikan di malam hari untuk menutup hari dengan produktif.`;

    return {
      phaseLabel,
      energyBadge,
      energyLevel,
      strategyAdvice,
      recommendedTask: bestTask,
      reason,
    };
  }, [currentHour, activeTodayTasks]);

  const handleStartTask = (task: Task) => {
    if (!task.isTimerRunning) {
      startTaskTimer(task.id);
      showToast(`Stopwatch pengerjaan "${task.title}" dimulai! ⏱️`);
    }
    setViewingTask(task);
  };

  return (
    <div className="today-energy-card animate-fade-in">
      <div className="today-energy-header">
        <div className="today-energy-meta">
          <span className="today-energy-badge">{analysis.energyBadge}</span>
          <span className="today-energy-phase">{analysis.phaseLabel}</span>
        </div>
      </div>

      {analysis.recommendedTask ? (
        <div className="today-energy-recommendation">
          <div className="today-energy-lead">
            <Sparkles size={14} className="text-amber" />
            <span className="recommendation-label">Rekomendasi Dikerjakan Sekarang:</span>
          </div>

          <div
            className="today-recommended-task-box"
            onClick={() => setViewingTask(analysis.recommendedTask!)}
            title="Klik untuk melihat rincian tugas"
          >
            <div className="recommended-task-info">
              <span className="recommended-task-title">{analysis.recommendedTask.title}</span>
              <p className="recommended-task-reason">{analysis.reason}</p>
            </div>

            <button
              type="button"
              className="btn-start-recommended"
              onClick={(e) => {
                e.stopPropagation();
                handleStartTask(analysis.recommendedTask!);
              }}
              title="Mulai rekam waktu pengerjaan tugas ini"
            >
              <Play size={12} fill="currentColor" />
              <span>Kerjakan</span>
            </button>
          </div>

          <div className="today-energy-strategy-tip">
            <span className="tip-caption">💡 Strategi:</span> {analysis.strategyAdvice}
          </div>
        </div>
      ) : (
        <div className="today-energy-all-done">
          <CheckCircle2 size={20} className="text-emerald" />
          <div className="all-done-text">
            <strong>Target Today Tuntas!</strong>
            <p>Seluruh tugas prioritas hari ini telah berhasil diselesaikan dengan baik. Luangkan waktu untuk istirahat.</p>
          </div>
        </div>
      )}
    </div>
  );
};
