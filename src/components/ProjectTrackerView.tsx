'use client';

import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { ProjectItem, ProjectCategory, ProjectMilestone } from '../types/project';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  MoreVertical,
  Flag,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  Trophy,
  Compass,
  Check,
  CalendarDays,
  Layers,
} from 'lucide-react';

const CATEGORY_COLORS: Record<ProjectCategory, { bg: string; text: string; border: string }> = {
  Pribadi: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  Karier: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Kesehatan: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  Keahlian: { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
  Finansial: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Lainnya: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

const PROJECT_TEMPLATES = [
  {
    title: 'Merilis Portofolio Web & Produk Digital V1',
    objective: 'Meluncurkan MVP aplikasi fungsional dan halaman portofolio interaktif dalam 1 kuartal',
    category: 'Karier' as ProjectCategory,
    quarterLabel: 'Kuartal 1 (3 Bulan)',
    durationDays: 90,
    milestones: [
      'Riset kebutuhan pasar dan validasi fitur utama',
      'Desain arsitektur UI/UX dan alur pengguna interaktif',
      'Pengembangan fitur inti dan pengujian sistem',
      'Peluncuran resmi ke publik dan publikasi artikel',
    ],
  },
  {
    title: 'Transformasi Kebugaran 90 Hari (Sprint 5K)',
    objective: 'Membangun disiplin fisik, konsisten lari 5 km non-stop, dan mencapai berat badan ideal',
    category: 'Kesehatan' as ProjectCategory,
    quarterLabel: 'Target 90 Hari',
    durationDays: 90,
    milestones: [
      'Bulan 1: Jalan cepat & jogging 2 km 3x seminggu',
      'Bulan 2: Tingkatkan ke 3.5 km dan disiplin pola nutrisi',
      'Bulan 3: Uji coba lari 5 km tuntas tanpa jeda istirahat',
    ],
  },
  {
    title: 'Keahlian Baru: Penguasaan Bahasa Asing',
    objective: 'Menguasai 500 kosakata percakapan dasar dan lulus ujian level awal dalam 3 bulan',
    category: 'Keahlian' as ProjectCategory,
    quarterLabel: 'Sprint 1 Kuartal',
    durationDays: 90,
    milestones: [
      'Kuasai tata bahasa dasar dan 150 kosakata pertama',
      'Latihan mendengar percakapan rutin 20 menit per hari',
      'Praktik simulasi berbicara 1 lawan 1 mingguan',
      'Uji coba tes kompetensi akhir kuartal',
    ],
  },
];

export const ProjectTrackerView: React.FC = () => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectMilestone,
    addProjectMilestone,
    deleteProjectMilestone,
    toggleProjectComplete,
    showToast,
  } = useTask();

  // Filter tab: 'all' | 'active' | 'completed'
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formCategory, setFormCategory] = useState<ProjectCategory>('Pribadi');
  const [formQuarterLabel, setFormQuarterLabel] = useState('Kuartal 1 (3 Bulan)');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formMilestones, setFormMilestones] = useState<{ id: string; title: string; dueDate?: string }[]>([]);
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Inline milestone add per project card
  const [inlineMilestoneInputs, setInlineMilestoneInputs] = useState<Record<string, string>>({});

  // Helper date functions
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const formatReadableDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const calculateDaysRemaining = (endDateStr: string) => {
    try {
      const now = new Date(todayStr).getTime();
      const end = new Date(endDateStr).getTime();
      const diffMs = end - now;
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Helper untuk preset durasi deadline
  const setPresetDuration = (days: number) => {
    const start = formStartDate ? new Date(formStartDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const ey = end.getFullYear();
    const em = String(end.getMonth() + 1).padStart(2, '0');
    const ed = String(end.getDate()).padStart(2, '0');
    setFormEndDate(`${ey}-${em}-${ed}`);

    if (days === 30) setFormQuarterLabel('Target 1 Bulan');
    else if (days === 90) setFormQuarterLabel('Kuartal (3 Bulan)');
    else if (days === 180) setFormQuarterLabel('Semester (6 Bulan)');
  };

  // Buka form modal untuk buat baru
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormObjective('');
    setFormCategory('Pribadi');
    setFormStartDate(todayStr);

    // Default 3 bulan (90 hari)
    const endD = new Date();
    endD.setDate(endD.getDate() + 90);
    const ey = endD.getFullYear();
    const em = String(endD.getMonth() + 1).padStart(2, '0');
    const ed = String(endD.getDate()).padStart(2, '0');
    setFormEndDate(`${ey}-${em}-${ed}`);
    setFormQuarterLabel('Kuartal (3 Bulan)');

    setFormMilestones([
      { id: 'm1', title: 'Perencanaan dan riset awal target kuartal' },
      { id: 'm2', title: 'Eksekusi bertahap & evaluasi progres tengah kuartal' },
      { id: 'm3', title: 'Penyelesaian sasaran dan pencapaian target akhir' },
    ]);
    setNewMilestoneInput('');
    setNewMilestoneDueDate('');
    setIsModalOpen(true);
  };

  // Buka form modal untuk edit
  const handleOpenEditModal = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormTitle(proj.title);
    setFormObjective(proj.objective);
    setFormCategory(proj.category);
    setFormQuarterLabel(proj.quarterLabel || 'Kuartal (3 Bulan)');
    setFormStartDate(proj.startDate);
    setFormEndDate(proj.endDate);
    setFormMilestones(proj.milestones.map((m) => ({ id: m.id, title: m.title, dueDate: m.dueDate })));
    setNewMilestoneInput('');
    setNewMilestoneDueDate('');
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  // Terapkan template ide proyek
  const handleApplyTemplate = (tpl: (typeof PROJECT_TEMPLATES)[0]) => {
    setFormTitle(tpl.title);
    setFormObjective(tpl.objective);
    setFormCategory(tpl.category);
    setFormQuarterLabel(tpl.quarterLabel);

    const start = new Date(todayStr);
    const end = new Date(start);
    end.setDate(end.getDate() + tpl.durationDays);
    const ey = end.getFullYear();
    const em = String(end.getMonth() + 1).padStart(2, '0');
    const ed = String(end.getDate()).padStart(2, '0');
    setFormEndDate(`${ey}-${em}-${ed}`);

    setFormMilestones(
      tpl.milestones.map((title, i) => ({
        id: `tpl_ms_${i}`,
        title,
      }))
    );
  };

  // Tambah milestone dalam modal
  const handleAddMilestoneInModal = () => {
    if (!newMilestoneInput.trim()) return;
    setFormMilestones((prev) => [
      ...prev,
      {
        id: `ms_${Date.now()}`,
        title: newMilestoneInput.trim(),
        dueDate: newMilestoneDueDate || undefined,
      },
    ]);
    setNewMilestoneInput('');
    setNewMilestoneDueDate('');
  };

  // Hapus milestone dalam modal
  const handleRemoveMilestoneInModal = (id: string) => {
    setFormMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Simpan formulir modal
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Judul proyek wajib diisi');
      return;
    }
    if (!formObjective.trim()) {
      showToast('Tentukan sasaran/target utama proyek');
      return;
    }
    if (!formEndDate) {
      showToast('Batas waktu (deadline) proyek wajib ditentukan');
      return;
    }

    const compiledMilestones: ProjectMilestone[] = formMilestones.map((m, idx) => {
      // Pertahankan status selesai jika sedang mengedit
      const existing = editingProject?.milestones.find((em) => em.id === m.id);
      return {
        id: m.id || `ms_${Date.now()}_${idx}`,
        title: m.title,
        dueDate: m.dueDate,
        isCompleted: existing ? existing.isCompleted : false,
        completedAt: existing ? existing.completedAt : undefined,
      };
    });

    if (editingProject) {
      updateProject({
        ...editingProject,
        title: formTitle.trim(),
        objective: formObjective.trim(),
        category: formCategory,
        quarterLabel: formQuarterLabel.trim() || 'Kuartal (3 Bulan)',
        startDate: formStartDate || todayStr,
        endDate: formEndDate,
        milestones: compiledMilestones,
      });
    } else {
      addProject({
        title: formTitle.trim(),
        objective: formObjective.trim(),
        category: formCategory,
        quarterLabel: formQuarterLabel.trim() || 'Kuartal (3 Bulan)',
        startDate: formStartDate || todayStr,
        endDate: formEndDate,
        milestones: compiledMilestones,
        isCompleted: false,
      });
    }

    setIsModalOpen(false);
  };

  // Handle inline add milestone pada kartu proyek
  const handleInlineAddMilestone = (projectId: string) => {
    const text = inlineMilestoneInputs[projectId]?.trim();
    if (!text) return;
    addProjectMilestone(projectId, text);
    setInlineMilestoneInputs((prev) => ({ ...prev, [projectId]: '' }));
  };

  // Filter list proyek
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterStatus === 'active') return !p.isCompleted;
      if (filterStatus === 'completed') return p.isCompleted;
      return true;
    });
  }, [projects, filterStatus]);

  // Statistik Ringkasan
  const totalCount = projects.length;
  const activeCount = projects.filter((p) => !p.isCompleted).length;
  const completedCount = projects.filter((p) => p.isCompleted).length;

  const totalMilestonesCount = projects.reduce((acc, p) => acc + p.milestones.length, 0);
  const totalCompletedMilestonesCount = projects.reduce(
    (acc, p) => acc + p.milestones.filter((m) => m.isCompleted).length,
    0
  );
  const overallMilestonePercent =
    totalMilestonesCount > 0 ? Math.round((totalCompletedMilestonesCount / totalMilestonesCount) * 100) : 0;

  return (
    <div className="project-tracker-container">
      {/* 1. Header Banner & Quick Actions */}
      <div className="project-header-card">
        <div className="project-header-top">
          <div className="project-header-icon-box">
            <Target size={22} className="text-primary" />
          </div>
          <div className="project-header-text">
            <h2 className="project-header-title">Target Proyek Kuartal (3 Bulan)</h2>
            <p className="project-header-desc">
              Mini-goals personal berorientasi hasil dengan milestone bertahap dan batas deadline jelas.
            </p>
          </div>
        </div>

        {/* Ringkasan Metrik Cepat */}
        <div className="project-stats-grid">
          <div className="project-stat-item">
            <span className="project-stat-val text-primary">{activeCount}</span>
            <span className="project-stat-lbl">Proyek Aktif</span>
          </div>
          <div className="project-stat-item">
            <span className="project-stat-val text-success">{completedCount}</span>
            <span className="project-stat-lbl">Selesai</span>
          </div>
          <div className="project-stat-item">
            <span className="project-stat-val text-amber">{overallMilestonePercent}%</span>
            <span className="project-stat-lbl">Milestone Tercapai</span>
          </div>
        </div>

        {/* Tombol Buat Proyek Baru */}
        <button type="button" className="btn-create-project-cta" onClick={handleOpenCreateModal}>
          <Plus size={16} />
          <span>Buat Proyek Baru (Mini Goal)</span>
        </button>
      </div>

      {/* 2. Filter Status Tab Chips */}
      <div className="project-filter-bar">
        <button
          type="button"
          className={`project-filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          <span>Aktif ({activeCount})</span>
        </button>
        <button
          type="button"
          className={`project-filter-chip ${filterStatus === 'completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('completed')}
        >
          <span>Selesai ({completedCount})</span>
        </button>
        <button
          type="button"
          className={`project-filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          <span>Semua ({totalCount})</span>
        </button>
      </div>

      {/* 3. Daftar Kartu Proyek */}
      {filteredProjects.length > 0 ? (
        <div className="project-cards-list">
          {filteredProjects.map((project) => {
            const completedMsCount = project.milestones.filter((m) => m.isCompleted).length;
            const totalMsCount = project.milestones.length;
            const progressPercent = totalMsCount > 0 ? Math.round((completedMsCount / totalMsCount) * 100) : 0;
            const daysRemaining = calculateDaysRemaining(project.endDate);
            const catColors = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.Lainnya;

            return (
              <div
                key={project.id}
                className={`project-card ${project.isCompleted ? 'is-completed' : ''}`}
                style={{
                  borderTop: `3.5px solid ${project.isCompleted ? '#10b981' : catColors.text}`,
                }}
              >
                {/* Baris Atas: Kategori, Quarter Badge & Opsi Menu */}
                <div className="project-card-header">
                  <div className="project-tags-group">
                    <span
                      className="project-category-badge"
                      style={{
                        backgroundColor: catColors.bg,
                        color: catColors.text,
                        borderColor: catColors.border,
                      }}
                    >
                      {project.category}
                    </span>
                    {project.quarterLabel && (
                      <span className="project-quarter-badge">
                        <Flag size={10} />
                        <span>{project.quarterLabel}</span>
                      </span>
                    )}
                  </div>

                  {/* Dropdown Menu Titik Tiga */}
                  <div className="project-menu-anchor">
                    <button
                      type="button"
                      className="project-menu-btn"
                      onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                      title="Opsi proyek"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === project.id && (
                      <div className="project-dropdown-menu">
                        <button
                          type="button"
                          className="project-dropdown-item"
                          onClick={() => {
                            toggleProjectComplete(project.id);
                            setActiveMenuId(null);
                          }}
                        >
                          <CheckCircle2 size={14} className="text-success" />
                          <span>{project.isCompleted ? 'Tandai Belum Selesai' : 'Tandai Proyek Selesai'}</span>
                        </button>
                        <button
                          type="button"
                          className="project-dropdown-item"
                          onClick={() => handleOpenEditModal(project)}
                        >
                          <Edit3 size={14} className="text-primary" />
                          <span>Edit Proyek</span>
                        </button>
                        <button
                          type="button"
                          className="project-dropdown-item text-danger"
                          onClick={() => {
                            if (window.confirm(`Hapus proyek "${project.title}"?`)) {
                              deleteProject(project.id);
                            }
                            setActiveMenuId(null);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Hapus Proyek</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Judul & Sasaran Utama (Mini Goal) */}
                <div className="project-card-body">
                  <h3 className={`project-title ${project.isCompleted ? 'completed-text' : ''}`}>
                    {project.title}
                  </h3>

                  <div className="project-objective-box">
                    <Target size={13} className="objective-icon" />
                    <span className="objective-label">Sasaran Utama:</span>
                    <span className="objective-text">{project.objective}</span>
                  </div>

                  {project.description && <p className="project-desc">{project.description}</p>}
                </div>

                {/* Tanggal & Deadline Indicator */}
                <div className="project-dates-row">
                  <div className="project-date-item" title="Rentang waktu pelaksanaan">
                    <Calendar size={13} />
                    <span>
                      {formatReadableDate(project.startDate)} &rarr; {formatReadableDate(project.endDate)}
                    </span>
                  </div>

                  {project.isCompleted ? (
                    <span className="project-status-pill completed">
                      <Trophy size={11} />
                      <span>Selesai 🏆</span>
                    </span>
                  ) : daysRemaining < 0 ? (
                    <span className="project-status-pill overdue" title="Melewati target batas waktu">
                      <AlertCircle size={11} />
                      <span>Lewat {Math.abs(daysRemaining)} hari</span>
                    </span>
                  ) : daysRemaining <= 7 ? (
                    <span className="project-status-pill urgent" title="Mendekati deadline kuartal">
                      <Clock size={11} />
                      <span>{daysRemaining} hari tersisa!</span>
                    </span>
                  ) : daysRemaining <= 30 ? (
                    <span className="project-status-pill warning">
                      <Clock size={11} />
                      <span>{daysRemaining} hari tersisa</span>
                    </span>
                  ) : (
                    <span className="project-status-pill normal">
                      <Clock size={11} />
                      <span>{daysRemaining} hari tersisa</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar Milestone */}
                <div className="project-progress-section">
                  <div className="progress-info-row">
                    <span className="progress-label">Milestone Tercapai:</span>
                    <span className="progress-value">
                      <strong>{completedMsCount}</strong>/{totalMsCount} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="project-progress-track">
                    <div
                      className={`project-progress-fill ${project.isCompleted ? 'all-done' : ''}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Daftar Milestone Bertahap */}
                <div className="project-milestones-container">
                  <div className="milestones-header-row">
                    <span className="milestones-title">Target Bertahap (Milestones):</span>
                  </div>

                  <div className="milestones-list">
                    {project.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`milestone-item-row ${milestone.isCompleted ? 'is-done' : ''}`}
                      >
                        <button
                          type="button"
                          className={`milestone-checkbox-btn ${milestone.isCompleted ? 'checked' : ''}`}
                          onClick={() => toggleProjectMilestone(project.id, milestone.id)}
                          title={milestone.isCompleted ? 'Batal tandai selesai' : 'Tandai milestone selesai'}
                        >
                          {milestone.isCompleted && <Check size={11} strokeWidth={3} />}
                        </button>

                        <div
                          className="milestone-content"
                          onClick={() => toggleProjectMilestone(project.id, milestone.id)}
                        >
                          <span className={`milestone-title ${milestone.isCompleted ? 'done-text' : ''}`}>
                            {milestone.title}
                          </span>
                          {milestone.dueDate && (
                            <span className="milestone-target-date">
                              <CalendarDays size={10} />
                              <span>Target: {formatReadableDate(milestone.dueDate)}</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-delete-milestone"
                          onClick={() => deleteProjectMilestone(project.id, milestone.id)}
                          title="Hapus milestone"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Input Cepat Tambah Milestone Baru */}
                  {!project.isCompleted && (
                    <div className="inline-add-milestone-row">
                      <input
                        type="text"
                        className="inline-milestone-input"
                        placeholder="+ Tambah milestone berikutnya..."
                        value={inlineMilestoneInputs[project.id] || ''}
                        onChange={(e) =>
                          setInlineMilestoneInputs((prev) => ({ ...prev, [project.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInlineAddMilestone(project.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-inline-milestone-submit"
                        disabled={!inlineMilestoneInputs[project.id]?.trim()}
                        onClick={() => handleInlineAddMilestone(project.id)}
                        title="Simpan milestone"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="project-empty-card">
          <div className="project-empty-icon-bubble">
            <Compass size={28} />
          </div>
          <h3 className="project-empty-title">
            {filterStatus === 'completed'
              ? 'Belum Ada Proyek Selesai'
              : filterStatus === 'active'
              ? 'Tidak Ada Proyek Aktif'
              : 'Belum Ada Proyek Mini Goals'}
          </h3>
          <p className="project-empty-desc">
            {filterStatus === 'completed'
              ? 'Tuntaskan milestone pada proyek aktif Anda untuk merayakan pencapaian di sini.'
              : 'Buat proyek pribadi pertama Anda berdurasi 3 bulan atau 1 kuartal dengan target terukur.'}
          </p>
          <button type="button" className="btn-empty-create" onClick={handleOpenCreateModal}>
            <Plus size={15} />
            <span>Mulai Buat Proyek Kuartal</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          MODAL: FORM BUAT / EDIT PROYEK (MINI GOAL KUARTAL)
          ========================================================================= */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container project-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Target size={18} className="text-primary" />
                <h3 className="modal-title">
                  {editingProject ? 'Edit Sasaran Proyek' : 'Buat Sasaran Proyek (Mini Goal)'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="project-modal-form">
              {/* Template Cepat (Hanya untuk Proyek Baru) */}
              {!editingProject && (
                <div className="form-template-section">
                  <span className="template-caption">
                    <Sparkles size={12} className="text-amber" />
                    <span>Inspirasi Cepat Mini Goal (1 Kuartal):</span>
                  </span>
                  <div className="template-chips-row">
                    {PROJECT_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="template-chip"
                        onClick={() => handleApplyTemplate(tpl)}
                        title={`Gunakan template: ${tpl.title}`}
                      >
                        {tpl.title.split(':')[0].slice(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Judul Proyek */}
              <div className="form-field-group">
                <label className="field-label">Nama Proyek / Sasaran *</label>
                <input
                  type="text"
                  className="form-text-input"
                  placeholder="Contoh: Merilis Portofolio Web & Produk Digital V1"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Input Sasaran Utama / Objective */}
              <div className="form-field-group">
                <label className="field-label">
                  Sasaran Utama (Target Personal) *
                </label>
                <textarea
                  className="form-textarea-input"
                  rows={2}
                  placeholder="Apa tujuan akhir terukur yang ingin dicapai dalam 3 bulan ini?"
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  required
                />
              </div>

              {/* Kategori & Label Kuartal */}
              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="field-label">Kategori</label>
                  <select
                    className="form-select-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProjectCategory)}
                  >
                    <option value="Pribadi">Pribadi</option>
                    <option value="Karier">Karier</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Keahlian">Keahlian</option>
                    <option value="Finansial">Finansial</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="field-label">Label Periode</label>
                  <input
                    type="text"
                    className="form-text-input"
                    placeholder="Contoh: Kuartal 1 (3 Bulan)"
                    value={formQuarterLabel}
                    onChange={(e) => setFormQuarterLabel(e.target.value)}
                  />
                </div>
              </div>

              {/* Rentang Waktu: Mulai, Deadline & Preset Cepat */}
              <div className="form-field-group">
                <div className="deadline-header-row">
                  <label className="field-label">Rentang Tanggal & Batas Waktu (Deadline) *</label>
                  <div className="preset-buttons-row">
                    <button
                      type="button"
                      className="btn-preset-duration"
                      onClick={() => setPresetDuration(30)}
                      title="Atur deadline 1 bulan dari sekarang"
                    >
                      1 Bulan
                    </button>
                    <button
                      type="button"
                      className="btn-preset-duration active"
                      onClick={() => setPresetDuration(90)}
                      title="Atur deadline 3 bulan (1 kuartal)"
                    >
                      3 Bulan (Kuartal)
                    </button>
                    <button
                      type="button"
                      className="btn-preset-duration"
                      onClick={() => setPresetDuration(180)}
                      title="Atur deadline 6 bulan"
                    >
                      6 Bulan
                    </button>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div>
                    <span className="field-sublabel">Mulai:</span>
                    <input
                      type="date"
                      className="form-date-input"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="field-sublabel">Batas Selesai (Deadline):</span>
                    <input
                      type="date"
                      className="form-date-input highlight-deadline"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Milestones Builder */}
              <div className="form-field-group">
                <label className="field-label">Daftar Target Bertahap (Milestones)</label>
                <p className="field-help-text">
                  Pecah sasaran 3 bulan ini menjadi beberapa tahapan target yang bisa diceklist bertahap.
                </p>

                {/* List Milestones yang sudah ditambahkan */}
                <div className="modal-milestone-builder-list">
                  {formMilestones.map((ms, index) => (
                    <div key={ms.id} className="builder-milestone-row">
                      <span className="builder-step-num">{index + 1}</span>
                      <div className="builder-title-col">
                        <span className="builder-ms-title">{ms.title}</span>
                        {ms.dueDate && (
                          <span className="builder-ms-due">Target: {formatReadableDate(ms.dueDate)}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-builder-ms"
                        onClick={() => handleRemoveMilestoneInModal(ms.id)}
                        title="Hapus milestone ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Baris Tambah Milestone di Modal */}
                <div className="modal-add-ms-input-box">
                  <input
                    type="text"
                    className="modal-add-ms-text"
                    placeholder="Tulis langkah milestone berikutnya..."
                    value={newMilestoneInput}
                    onChange={(e) => setNewMilestoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestoneInModal();
                      }
                    }}
                  />
                  <div className="modal-add-ms-bottom">
                    <div className="modal-add-ms-date">
                      <Calendar size={12} className="text-muted" />
                      <input
                        type="date"
                        className="modal-date-picker-tiny"
                        title="Target tanggal capaian milestone ini (opsional)"
                        value={newMilestoneDueDate}
                        onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-add-ms-pill"
                      disabled={!newMilestoneInput.trim()}
                      onClick={handleAddMilestoneInModal}
                    >
                      <Plus size={13} />
                      <span>Tambahkan Milestone</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Simpan */}
              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-modal-save-project">
                  <Check size={16} />
                  <span>{editingProject ? 'Perbarui Proyek' : 'Simpan Proyek'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
