export type RoutineScheduleType = 'daily' | 'specific_days'; // Setiap hari / Hari tertentu
export type RoutineRecurrence = 'daily' | 'weekly' | 'monthly'; // Pengulangan: harian / mingguan / bulanan

export interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  startTime?: string; // Format HH:mm (Waktu mulai pelaksanaan aktivitas)
  endTime?: string; // Format HH:mm (Waktu selesai pelaksanaan aktivitas)
  startDate?: string; // Format YYYY-MM-DD (Opsional: Target periode rutinitas mulai)
  endDate?: string; // Format YYYY-MM-DD (Opsional: Target periode rutinitas selesai)
  scheduleType: RoutineScheduleType;
  selectedDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  recurrence: RoutineRecurrence;
  completedDates: string[]; // Daftar YYYY-MM-DD yang sudah diceklist (absensi)
  createdAt: string;
}
