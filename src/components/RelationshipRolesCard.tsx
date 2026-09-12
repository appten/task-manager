'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { LifeRelationship, Task } from '../types/task';
import {
  HeartHandshake,
  Heart,
  Home,
  Smile,
  Briefcase,
  Users,
  Star,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';

interface RelationshipRolesCardProps {
  onOpenFormForRole?: (relationshipId: string) => void;
}

export const RelationshipRolesCard: React.FC<RelationshipRolesCardProps> = ({
  onOpenFormForRole,
}) => {
  const {
    relationships,
    addRelationship,
    deleteRelationship,
    getActiveTaskForRelationship,
    addTaskForRelationship,
    toggleTaskStatus,
    showToast,
  } = useTask();

  // State untuk Quick Add 1 Task pada relasi tertentu
  const [activePromptRelId, setActivePromptRelId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('');

  // State Modal Tambah Peran Baru
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newIconType, setNewIconType] = useState<'heart' | 'home' | 'users' | 'briefcase' | 'smile' | 'star'>('heart');
  const [newColor, setNewColor] = useState('#e11d48');
  const [newDesc, setNewDesc] = useState('');

  // Hitung berapa hubungan yang aktif terjaga (memiliki 1 task aktif)
  const activeCount = relationships.filter((r) =>
    Boolean(getActiveTaskForRelationship(r.id))
  ).length;

  const totalRel = relationships.length;
  const progressPercent = totalRel > 0 ? Math.round((activeCount / totalRel) * 100) : 0;

  // Icon Helper
  const renderRoleIcon = (iconType: string, size = 16) => {
    switch (iconType) {
      case 'heart':
        return <Heart size={size} />;
      case 'home':
        return <Home size={size} />;
      case 'smile':
        return <Smile size={size} />;
      case 'briefcase':
        return <Briefcase size={size} />;
      case 'users':
        return <Users size={size} />;
      case 'star':
      default:
        return <Star size={size} />;
    }
  };

  // Tangani simpan 1 tugas cepat dari pemantik / input
  const handleQuickAddForRel = (relId: string, titleToUse?: string) => {
    const finalTitle = (titleToUse || quickTaskTitle).trim();
    if (!finalTitle) return;

    const result = addTaskForRelationship(relId, finalTitle, undefined, quickTaskTime || undefined);
    if (result.success) {
      setQuickTaskTitle('');
      setQuickTaskTime('');
      setActivePromptRelId(null);
    }
  };

  // Tangani tambah peran baru
  const handleSaveNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    addRelationship({
      roleName: newRoleName.trim(),
      personName: newPersonName.trim() || undefined,
      iconType: newIconType,
      color: newColor,
      description: newDesc.trim() || 'Menjaga komunikasi & perhatian nyata',
      suggestedTasks: [
        `Sapa dan beri perhatian untuk ${newRoleName.trim()}`,
        `Luangkan 15 menit waktu berkualitas`,
        `Dengarkan cerita atau kendala yang dihadapi`,
      ],
    });

    setNewRoleName('');
    setNewPersonName('');
    setNewDesc('');
    setIsAddRoleModalOpen(false);
  };

  return (
    <section className="rel-roles-card-container" aria-label="Peran dan Jaga Hubungan">
      {/* Header Utama Fitur */}
      <div className="rel-card-header">
        <div className="rel-header-left">
          <div className="rel-header-icon-badge">
            <HeartHandshake size={18} />
          </div>
          <div>
            <div className="rel-title-row">
              <h2 className="rel-heading">Peran & Jaga Hubungan</h2>
              <span className="rel-count-badge">
                {activeCount}/{totalRel} Terjaga
              </span>
            </div>
            <p className="rel-subheading">
              Trigger agar tak lupa orang terdekat • Dibatasi <strong>1 tugas fokus</strong> per hubungan
            </p>
          </div>
        </div>

        <button
          type="button"
          className="rel-btn-add-role"
          onClick={() => setIsAddRoleModalOpen(true)}
          title="Tambah Peran / Hubungan Baru"
        >
          <Plus size={13} />
          <span>Peran</span>
        </button>
      </div>

      {/* Progress Bar Keseimbangan Hubungan */}
      <div className="rel-progress-bar-track" title={`${progressPercent}% hubungan memiliki tugas aktif`}>
        <div
          className="rel-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Daftar Kartu Relasi / Peran (Format List Vertikal) */}
      <div className="rel-roles-list">
        {relationships.map((rel) => {
          const activeTask = getActiveTaskForRelationship(rel.id);
          const hasTask = Boolean(activeTask);
          const isPromptOpen = activePromptRelId === rel.id;

          return (
            <div
              key={rel.id}
              className={`rel-role-item-card ${hasTask ? 'is-active-nurtured' : 'is-empty'}`}
            >
              {/* Header Kartu Relasi */}
              <div className="role-item-header">
                <div className="role-avatar-title">
                  <div
                    className="role-avatar-circle"
                    style={{ backgroundColor: `${rel.color}15`, color: rel.color }}
                  >
                    {renderRoleIcon(rel.iconType, 16)}
                  </div>
                  <div>
                    <h3 className="role-item-name">{rel.roleName}</h3>
                    {rel.description && (
                      <p className="role-item-desc">{rel.description}</p>
                    )}
                  </div>
                </div>

                {/* Status Slot 1/1 */}
                <div className="role-status-slot">
                  {hasTask ? (
                    <span className="slot-badge full" title="Maksimal 1 aktivitas terpenuhi">
                      <ShieldCheck size={12} />
                      <span>1/1 Terjaga</span>
                    </span>
                  ) : (
                    <span className="slot-badge empty" title="Belum ada aktivitas untuk hubungan ini">
                      <AlertCircle size={12} />
                      <span>0/1 Belum Ada</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Konten Tugas Aktif (Jika Ada) */}
              {hasTask && activeTask && (
                <div className="role-active-task-box">
                  <div className="active-task-main">
                    <button
                      type="button"
                      className="btn-complete-rel-task"
                      onClick={() => {
                        toggleTaskStatus(activeTask.id);
                        showToast(`Luar biasa! Tugas untuk "${rel.roleName}" tuntas! Relasi terjaga hangat 🎉`);
                      }}
                      title="Tandai Selesai (Slot akan kosong kembali)"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <div className="active-task-texts">
                      <span className="active-task-title">{activeTask.title}</span>
                      <div className="active-task-meta">
                        {activeTask.dueTime && (
                          <span className="meta-time">
                            <Clock size={10} /> {activeTask.dueTime}
                          </span>
                        )}
                        <span className="meta-rule-hint">
                          Fokus 1 tugas ini sebelum menambah tugas baru
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Konten Belum Ada Tugas (Trigger & Pemantik) */}
              {!hasTask && (
                <div className="role-empty-prompt-box">
                  <div className="prompt-intro-row">
                    <span className="prompt-lead-text">
                      Luangkan 1 tindakan bermakna untuk menjaga relasi ini:
                    </span>
                  </div>

                  {/* Saran Pemantik 1-Klik */}
                  {rel.suggestedTasks && rel.suggestedTasks.length > 0 && !isPromptOpen && (
                    <div className="prompt-suggestions-row">
                      {rel.suggestedTasks.slice(0, 2).map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="prompt-sug-chip"
                          onClick={() => handleQuickAddForRel(rel.id, sug)}
                          title={`Jadikan tugas: "${sug}"`}
                        >
                          <Sparkles size={11} className="sug-icon" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Form Input Cepat 1 Tugas */}
                  {isPromptOpen ? (
                    <div className="role-quick-input-panel">
                      <input
                        type="text"
                        className="role-quick-task-input"
                        placeholder={`Tulis 1 tugas penting untuk ${rel.roleName}...`}
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddForRel(rel.id);
                          }
                        }}
                        autoFocus
                      />
                      <div className="role-quick-input-actions">
                        <input
                          type="time"
                          className="role-quick-time-input"
                          value={quickTaskTime}
                          onChange={(e) => setQuickTaskTime(e.target.value)}
                          title="Jam (opsional)"
                        />
                        <button
                          type="button"
                          className="btn-submit-rel-task"
                          disabled={!quickTaskTitle.trim()}
                          onClick={() => handleQuickAddForRel(rel.id)}
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-rel-task"
                          onClick={() => {
                            setActivePromptRelId(null);
                            setQuickTaskTitle('');
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prompt-action-footer">
                      <button
                        type="button"
                        className="btn-open-prompt"
                        onClick={() => {
                          setActivePromptRelId(rel.id);
                          setQuickTaskTitle('');
                        }}
                      >
                        <Plus size={13} />
                        <span>+ 1 Tugas Penting</span>
                      </button>

                      {onOpenFormForRole && (
                        <button
                          type="button"
                          className="btn-open-full-form-rel"
                          onClick={() => onOpenFormForRole(rel.id)}
                          title="Buka form lengkap dengan opsi detail"
                        >
                          Form Lengkap
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Peran / Relasi Baru */}
      {isAddRoleModalOpen && (
        <div className="task-modal-backdrop" onClick={() => setIsAddRoleModalOpen(false)}>
          <div className="task-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar" />
            <div className="task-modal-header">
              <div className="task-modal-title-box">
                <div className="task-modal-icon-badge" style={{ background: '#fdf2f8', color: '#db2777' }}>
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <h2 className="task-modal-heading">Tambah Peran & Relasi</h2>
                  <p className="task-modal-subheading">
                    Jaga hubungan penting dalam hidup Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="task-modal-close-btn"
                onClick={() => setIsAddRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewRole} className="task-fast-form" style={{ padding: '16px' }}>
              <div className="fast-form-section">
                <label className="fast-form-label">
                  Nama Peran / Hubungan <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="fast-text-input primary-title"
                  placeholder="Contoh: Anak, Mentor, Klien Utama..."
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="fast-form-section">
                <label className="fast-form-label">Panggilan / Nama Orang (Opsional)</label>
                <input
                  type="text"
                  className="fast-text-input"
                  placeholder="Contoh: Siti, Mas Budi, Pak Anton..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                />
              </div>

              <div className="fast-form-row">
                <div className="fast-form-col">
                  <label className="fast-form-label">Pilihan Icon</label>
                  <div className="fast-priority-group">
                    {[
                      { type: 'heart', label: '💖 Hati' },
                      { type: 'home', label: '🏠 Rumah' },
                      { type: 'smile', label: '🤝 Teman' },
                      { type: 'briefcase', label: '💼 Kerja' },
                    ].map((ic) => (
                      <button
                        key={ic.type}
                        type="button"
                        className={`fast-prio-btn ${newIconType === ic.type ? 'active' : ''}`}
                        onClick={() => setNewIconType(ic.type as any)}
                      >
                        {ic.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fast-form-col">
                  <label className="fast-form-label">Warna Tema</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    {['#e11d48', '#d97706', '#2563eb', '#7c3aed', '#059669'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: newColor === c ? '3px solid #0f172a' : '2px solid #ffffff',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="fast-form-section">
                <label className="fast-form-label">Motto / Komitmen Menjaga Relasi</label>
                <input
                  type="text"
                  className="fast-text-input"
                  placeholder="Contoh: Saling sapa rutin & beri apresiasi nyata..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="fast-form-actions" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="fast-btn-cancel"
                  onClick={() => setIsAddRoleModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="fast-btn-submit"
                  disabled={!newRoleName.trim()}
                >
                  <Plus size={16} />
                  <span>Simpan Peran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
