export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate?: string; // Format: YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
}

export type ProjectCategory = 'Pribadi' | 'Karier' | 'Kesehatan' | 'Keahlian' | 'Finansial' | 'Lainnya';

export interface ProjectItem {
  id: string;
  title: string;
  objective: string; // Sasaran utama / target personal yang ingin dicapai (mini goal 3 bulan/1 kuartal)
  description?: string;
  category: ProjectCategory;
  quarterLabel?: string; // e.g. "Q1 2026", "3 Bulan"
  startDate: string; // Format: YYYY-MM-DD (Waktu mulai proyek)
  endDate: string; // Format: YYYY-MM-DD (Batas waktu / deadline proyek)
  milestones: ProjectMilestone[];
  isCompleted: boolean;
  completedAt?: string;
  color?: string; // Hex color atau tag styling
  createdAt: string;
  updatedAt?: string;
}
