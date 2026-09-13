export type HabitFrequency = 'daily' | 'weekdays' | 'specific_days';

export interface WeeklyRoutine {
  title: string;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  time?: string; // Format HH:mm
  lastCompletedWeek?: string; // e.g. "2026-W37"
}

export interface HabitItem {
  id: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  frequency: HabitFrequency;
  customDays?: number[]; // 0 = Minggu, 1 = Senin, dst.
  weeklyRoutine?: WeeklyRoutine; // Maksimal 1 aktivitas rutin mingguan
  completedDates: string[]; // Array of YYYY-MM-DD
  createdAt: string;
}
