'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle2 } from 'lucide-react';
import { feedbackService, FeedbackItem } from '../services/feedbackService';
import { useTask } from '../context/TaskContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: FeedbackItem['category'][] = [
  'Saran Fitur',
  'Laporan Bug',
  'Kritik & Masukan',
  'Lainnya',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, showToast } = useTask();

  const [category, setCategory] = useState<FeedbackItem['category']>('Saran Fitur');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) return;

    setIsSubmitting(true);

    try {
      feedbackService.submitFeedback({
        category,
        senderName: name.trim() || undefined,
        senderEmail: email.trim() || undefined,
        message: message.trim(),
      });

      setIsSuccess(true);
      showToast('Terima kasih! Masukan Anda telah tersimpan ke sistem 💌');

      setTimeout(() => {
        setIsSuccess(false);
        setMessage('');
        setIsSubmitting(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSuccess(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay feedback-modal-overlay" onClick={handleClose}>
      <div className="modal-container feedback-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="feedback-header-group">
            <div className="feedback-icon-box">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="feedback-title">Kirim Masukan & Saran</h3>
              <span className="feedback-subtitle">
                Bantu kami meningkatkan pengalaman TEN Tasks
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Tutup formulir masukan"
          >
            <X size={17} />
          </button>
        </div>

        {isSuccess ? (
          <div className="feedback-success-box">
            <CheckCircle2 size={40} className="text-success-green" />
            <h4 className="success-title">Masukan Terkirim!</h4>
            <p className="success-desc">
              Terima kasih banyak atas waktu dan masukan Anda. Catatan Anda telah tersimpan dengan aman untuk ditinjau oleh pengembang.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            {/* Kategori Pills */}
            <div className="form-group">
              <label className="form-label">Kategori Masukan</label>
              <div className="feedback-category-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-pill-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Nama & Kontak Opsional */}
            <div className="form-row-dual">
              <div className="form-group">
                <label className="form-label">Nama (Opsional)</label>
                <input
                  type="text"
                  className="feedback-input"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email (Opsional)</label>
                <input
                  type="email"
                  className="feedback-input"
                  placeholder="email@anda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Isi Pesan */}
            <div className="form-group">
              <label className="form-label">
                Pesan / Ulasan Anda <span className="required-mark">*</span>
              </label>
              <textarea
                rows={4}
                className="feedback-textarea"
                placeholder="Tuliskan saran, ide fitur baru, atau kendala yang Anda alami saat menggunakan aplikasi..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={5}
              />
              <span className="char-hint">Minimal 5 karakter</span>
            </div>

            {/* Footer Buttons */}
            <div className="modal-footer feedback-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-submit-feedback"
                disabled={isSubmitting || message.trim().length < 5}
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Masukan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
