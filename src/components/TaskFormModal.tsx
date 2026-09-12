'use client';

import React, { useEffect } from 'react';
import { TaskForm } from './TaskForm';
import { X, Sparkles, PlusCircle } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRelationshipId?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  defaultRelationshipId,
}) => {
  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Kunci scrolling body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="task-modal-backdrop animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="task-modal-sheet animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar Drag Indikator Android */}
        <div className="sheet-handle-bar" />

        {/* Modal Header */}
        <div className="task-modal-header">
          <div className="task-modal-title-box">
            <div className="task-modal-icon-badge">
              <PlusCircle size={18} />
            </div>
            <div>
              <h2 id="task-modal-title" className="task-modal-heading">
                Tambah Catatan Baru
              </h2>
              <p className="task-modal-subheading">
                Input cepat & terstruktur untuk Inbox
              </p>
            </div>
          </div>

          <button
            type="button"
            className="task-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup form"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: TaskForm Cepat & Nyaman */}
        <div className="task-modal-body">
          <TaskForm
            onSuccess={onClose}
            onCancel={onClose}
            defaultRelationshipId={defaultRelationshipId}
          />
        </div>
      </div>
    </div>
  );
};
