'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTask } from '../context/TaskContext';
import {
  Target,
  ArrowLeft,
  Check,
  Sparkles,
  ArrowUpRight,
  Minus,
  ArrowDownRight,
  Lightbulb,
  Edit3,
  X,
} from 'lucide-react';

export const GoalView: React.FC = () => {
  const router = useRouter();
  const { userGoal, saveUserGoal, showToast } = useTask();
  const [goalInput, setGoalInput] = useState(userGoal || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleStartEdit = () => {
    setGoalInput(userGoal || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setGoalInput(userGoal || '');
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    saveUserGoal(goalInput.trim());
    setIsEditing(false);
    showToast('Sasaran hidup (Goals) berhasil diperbarui! 🎯');
  };

  const sampleGoals = [
    'Merilis produk digital berdampak, menjaga kesehatan prima, dan mandiri finansial di 2026',
    'Menyelesaikan skripsi tepat waktu, lulus predikat cumlaude, dan memulai karir AI Engineer',
    'Membangun bisnis mandiri, mencapai 10 klien aktif, dan menjaga hidup seimbang berkualitas',
  ];

  return (
    <div className="goal-page-container">
      {/* 1. Header Navigasi Halaman Goal */}
      <header className="page-subnav-header">
        <button
          type="button"
          className="btn-subnav-back"
          onClick={() => router.back()}
          title="Kembali ke menu sebelumnya"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="subnav-title-group">
          <h2 className="subnav-page-title">Tujuan & Sasaran</h2>
          <span className="subnav-badge-caption">Goals 2026</span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <div className="goal-page-content">
        {/* 2. BAGIAN ATAS: Bagaimana Ini Bekerja & 3 Bagian Penjelasan Skor AI */}
        <div className="goal-eval-guide-card">
          <div className="eval-guide-top">
            <Sparkles size={16} className="sparkle-gold" />
            <h3 className="eval-guide-title">Bagaimana Fitur Ini Bekerja?</h3>
          </div>
          <p className="eval-guide-intro">
            Tujuan atau sasaran hidup Anda berfungsi sebagai kompas utama. Ketika Anda menjalankan analisis cerdas, AI akan membaca setiap tugas di Inbox dan mengevaluasi keselarasan dampaknya terhadap tujuan Anda dengan skala penilaian berikut:
          </p>

          <div className="eval-scores-grid">
            {/* Skor Positif */}
            <div className="score-box box-positive">
              <div className="score-box-top">
                <ArrowUpRight size={15} />
                <span className="score-range">+1 s/d +100</span>
              </div>
              <span className="score-status">Mendekatkan</span>
              <p className="score-detail">Tugas bernilai tinggi yang langsung membawa Anda mendekati sasaran.</p>
            </div>

            {/* Skor Netral */}
            <div className="score-box box-neutral">
              <div className="score-box-top">
                <Minus size={15} />
                <span className="score-range">0</span>
              </div>
              <span className="score-status">Netral</span>
              <p className="score-detail">Aktivitas operasional biasa, tugas rutin, atau administrasi umum.</p>
            </div>

            {/* Skor Negatif */}
            <div className="score-box box-negative">
              <div className="score-box-top">
                <ArrowDownRight size={15} />
                <span className="score-range">-1 s/d -100</span>
              </div>
              <span className="score-status">Menjauhkan</span>
              <p className="score-detail">Tugas berbobot rendah yang berpotensi menjadi distraksi dari sasaran utama.</p>
            </div>
          </div>
        </div>

        {/* 3. BAGIAN BAWAH: Sasaran Pengguna Saat Ini (Default Ringkas) / Mode Edit */}
        <div className="goal-user-section">
          {!isEditing ? (
            /* Tampilan Ringkas Sasaran Saat Ini */
            <div className="goal-current-display-card">
              <div className="goal-card-header-row">
                <div className="goal-card-title-wrap">
                  <div className="goal-hero-icon-small">
                    <Target size={16} />
                  </div>
                  <h4 className="goal-section-heading">Sasaran Utama Anda</h4>
                </div>

                <button
                  type="button"
                  className="btn-trigger-edit-goal"
                  onClick={handleStartEdit}
                  title="Ubah sasaran utama"
                >
                  <Edit3 size={13} />
                  <span>{userGoal ? 'Ubah Sasaran' : 'Tentukan Sasaran'}</span>
                </button>
              </div>

              {userGoal ? (
                <div className="goal-active-text-box">
                  <p className="goal-active-text">&ldquo;{userGoal}&rdquo;</p>
                  <span className="goal-active-hint">
                    Digunakan sebagai acuan personalisasi rekomendasi pada menu Asisten Cerdas.
                  </span>
                </div>
              ) : (
                <div className="goal-empty-placeholder">
                  <p className="goal-empty-text">Saat ini sasaran utama Anda masih kosong.</p>
                  <span className="goal-empty-sub">
                    Klik tombol &ldquo;Tentukan Sasaran&rdquo; di atas untuk menuliskan target prioritas Anda tahun ini.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Mode Form Edit (Hanya Muncul Saat Klik Edit) */
            <form onSubmit={handleSave} className="goal-edit-section">
              <div className="goal-form-header">
                <div className="goal-card-title-wrap">
                  <Target size={15} className="text-primary" />
                  <label htmlFor="goal-input-area" className="goal-input-label">
                    {userGoal ? 'Perbarui Sasaran Utama' : 'Tulis Sasaran Utama Baru'}
                  </label>
                </div>
                <span className="goal-char-counter">{goalInput.length} karakter</span>
              </div>

              <textarea
                id="goal-input-area"
                rows={3}
                className="goal-clean-textarea"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Tuliskan target prioritas Anda, misalnya: Merilis aplikasi baru, hidup sehat bugar, dan mandiri finansial..."
                autoFocus
                required
              />

              {/* Preset Inspirasi Cepat */}
              <div className="goal-presets-block">
                <div className="preset-block-label">
                  <Lightbulb size={12} />
                  <span>Inspirasi cepat (klik untuk terapkan):</span>
                </div>
                <div className="preset-pills-list">
                  {sampleGoals.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="preset-sample-chip"
                      onClick={() => setGoalInput(sample)}
                      title="Gunakan contoh ini"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Aksi Batal & Simpan */}
              <div className="goal-actions-row">
                <button
                  type="button"
                  className="btn-cancel-goal"
                  onClick={handleCancelEdit}
                >
                  <X size={14} />
                  <span>Batal</span>
                </button>

                <button
                  type="submit"
                  className="btn-save-goal"
                  disabled={!goalInput.trim()}
                >
                  <Check size={15} />
                  <span>Simpan Sasaran</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
