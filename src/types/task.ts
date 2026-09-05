export type Priority = 'low' | 'medium' | 'high';

export type Category = 'Pekerjaan' | 'Pribadi' | 'Belajar' | 'Kesehatan' | 'Lainnya';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ScheduledSession {
  id: string;
  startTime: string; // Format: HH:mm (e.g. "07:00")
  endTime: string; // Format: HH:mm (e.g. "09:00")
  label: string; // e.g. "Sesi 1 (2 jam)" atau "Sesi 2 Lanjutan (3 jam)"
  date?: string; // Format: YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // Format: YYYY-MM-DD (Batas akhir / tanggal utama)
  dueTime?: string; // Format: HH:mm (Batas jam akhir / jam utama)
  
  // Jadwal Mulai & Selesai yang Fleksibel & Opsional
  startDate?: string; // Tanggal mulai pengerjaan (opsional)
  startTime?: string; // Jam mulai pengerjaan (opsional, e.g. "07:00")
  endDate?: string; // Tanggal selesai pengerjaan (opsional)
  endTime?: string; // Jam selesai pengerjaan (opsional, e.g. "16:00")
  isUserStartTimeFixed?: boolean; // Penanda jam mulai diisi manual oleh user (AI dilarang mengubah)
  isUserEndTimeFixed?: boolean; // Penanda jam selesai diisi manual oleh user (AI dilarang mengubah)
  
  // Bobot Waktu & Karakteristik
  effortHours?: number; // Jam usaha pengerjaan (e.g. 5 jam)
  estimatedTime?: string; // Format teks: "30 menit", "5 jam", dll.
  allowConcurrent?: boolean; // Apakah tugas bisa dikerjakan bersamaan/multitasking (bobot ringan)
  
  // Hasil Pembagian Sesi & Catatan AI
  scheduledSessions?: ScheduledSession[]; // Sesi-sesi waktu teralokasi bebas bentrok
  schedulingNote?: string; // Catatan alasan pembagian jadwal dari AI
  isAiScheduled?: boolean; // Penanda jadwal telah dioptimasi oleh AI

  // Keselarasan Tujuan Hidup
  goalAlignmentScore?: number; // Skor keselarasan terhadap tujuan hidup: -100 s/d 100
  goalAlignmentReason?: string; // Penjelasan ringkas keselarasan tujuan

  priority: Priority;
  category: Category;
  isCompleted: boolean;
  subTasks: SubTask[];
  createdAt: string;
}

export type TabType = 'tasks' | 'new' | 'calendar';

export type FilterStatus = 'all' | 'active' | 'completed';

export interface TaskAnalysisItem {
  taskId: string;
  taskTitle: string;
  urgencyLevel: 'Segera' | 'Nanti' | 'Rutin';
  effortLevel: 'Ringan' | 'Sedang' | 'Tinggi';
  estimatedDuration: string;
  biologicalFit: string;
  goalAlignmentScore?: number; // Skor -100 s/d 100
  goalImpact?: 'Mendekatkan' | 'Netral' | 'Menjauhkan';
  reason: string;
}

export interface AIAnalysisResult {
  analyzedAt: string;
  currentTimeFormatted: string;
  circadianState: string;
  circadianAdvice: string;
  topPriorityTaskId?: string;
  overallSummary: string;
  userGoalContext?: string;
  tasksAnalysis: TaskAnalysisItem[];
}
