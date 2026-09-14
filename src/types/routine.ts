export type RoutineScheduleType = 'daily' | 'specific_days'; // Setiap hari / Hari tertentu
export type RoutineRecurrence = 'daily' | 'weekly' | 'monthly'; // Pengulangan: harian / mingguan / bulanan

export interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  startDate: string; // Format YYYY-MM-DD
  endDate: string; // Format YYYY-MM-DD
  scheduleType: RoutineScheduleType;
  selectedDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  recurrence: RoutineRecurrence;
  completedDates: string[]; // Daftar YYYY-MM-DD yang sudah diceklist (absensi)
  createdAt: string;
}
