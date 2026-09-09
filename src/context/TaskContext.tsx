'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task,
  TabType,
  FilterStatus,
  SubTask,
  AIAnalysisResult,
  ScheduleComparisonResult,
  RecurrenceType,
} from '../types/task';
import { INITIAL_TASKS, getFormattedDate } from '../data/seedTasks';
import { analyzeTasksWithCircadianAI } from '../services/geminiService';
import {
  scheduleDailyTasksSmartly,
  createSmartBreakTask,
  compareSchedules,
} from '../services/smartScheduler';
import { cloudSyncService, UserProfile } from '../services/cloudSyncService';

interface TaskContextType {
  // Cloudflare KV Sync & User Account (Opsional)
  currentUser: UserProfile | null;
  isSyncingCloud: boolean;
  lastCloudSyncedAt: string | null;
  isAutoSyncEnabled: boolean;
  loginUser: (email: string, password: string, mergeLocalData?: boolean) => Promise<{ success: boolean; error?: string }>;
  registerUser: (name: string, email: string, password: string, mergeLocalData?: boolean, recoveryPin?: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: (clearLocalTasks?: boolean) => void;
  triggerCloudSync: () => Promise<boolean>;
  toggleAutoSync: () => void;
  verifyRecoveryPin: (email: string, recoveryPin: string) => Promise<{ success: boolean; name?: string; error?: string }>;
  resetPasswordUser: (email: string, recoveryPin: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (name?: string, oldPassword?: string, newPassword?: string, recoveryPin?: string) => Promise<{ success: boolean; error?: string }>;
  tasks: Task[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  toastMessage: string | null;
  showToast: (message: string) => void;
  // Fitur Menu Today (Maksimal 5 tugas terpilih dari Inbox)
  todayTasks: Task[];
  toggleTodayTask: (taskId: string) => boolean;
  addToToday: (taskId: string) => boolean;
  removeFromToday: (taskId: string) => void;
  simulateMidnightRollover: () => void;
  isTaskFormOpen: boolean;
  setIsTaskFormOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  clearAllCompletedTasks: () => void;

  // Fitur Perekaman Waktu Pengerjaan / Stopwatch Aktivitas
  startTaskTimer: (taskId: string) => void;
  pauseTaskTimer: (taskId: string) => void;
  stopTaskTimer: (taskId: string) => void;
  resetTaskTimer: (taskId: string) => void;

  addTask: (newTask: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  toggleSubTaskStatus: (taskId: string, subTaskId: string) => void;
  addAISubTasks: (taskId: string, subTaskTitles: string[]) => void;
  addAISubTasksAndEstimate: (
    taskId: string,
    subTaskTitles: string[],
    estimatedTime: string,
    goalAlignmentScore?: number,
    goalAlignmentReason?: string
  ) => void;
  aiAnalysis: AIAnalysisResult | null;
  isAnalyzingAI: boolean;
  runTaskAnalysis: () => Promise<void>;
  clearAnalysis: () => void;
  userGoal: string;
  setUserGoal: (goal: string) => void;
  saveUserGoal: (goal: string) => void;
  isGoalModalOpen: boolean;
  setIsGoalModalOpen: (open: boolean) => void;
  autoScheduleDay: (dateStr: string) => void;
  addRecoveryBreak: (dateStr: string, type: 'lunch' | 'hydration' | 'afternoon' | 'dinner', startTime?: string) => void;
  resetToSampleData: () => void;
  clearAllTasksAndStartFresh: () => void;

  // Fitur Jadwal Paralel: Versi Ori vs Versi AI (1x Klik Berpindah)
  activeScheduleVersion: 'ori' | 'ai';
  setActiveScheduleVersion: (version: 'ori' | 'ai') => void;
  toggleScheduleVersion: () => void;
  getTasksForDateAndVersion: (dateStr: string, version?: 'ori' | 'ai') => Task[];

  // Fitur Komparasi & Pengaturan Jadwal AI (Sebelum vs Sesudah)
  previewAiSchedule: (dateStr: string) => ScheduleComparisonResult | null;
  applyAiSchedule: (dateStr: string) => void;
  revertToOriginal: (dateStr: string) => void;
  refreshAiSchedule: (dateStr: string) => ScheduleComparisonResult | null;
  getComparisonForDate: (dateStr: string) => ScheduleComparisonResult | null;
  hasOriginalSnapshot: (dateStr: string) => boolean;
  hasAiProposal: (dateStr: string) => boolean;
  activeScheduleModes: Record<string, 'original' | 'ai'>;
  toggleScheduleMode: (dateStr: string, mode: 'original' | 'ai') => void;
}

const STORAGE_KEY = 'ten_my_id_tasks_v01';
const STORAGE_ANALYSIS_KEY = 'ten_my_id_ai_analysis_v01';
const STORAGE_GOAL_KEY = 'ten_my_id_user_goal_v01';
const STORAGE_ORIGINAL_KEY = 'ten_my_id_original_schedules_v01';
const STORAGE_VERSION_KEY = 'ten_my_id_active_schedule_version_v01';

const DEFAULT_LIFE_GOAL = 'Merilis produk digital berdampak, menjaga kesehatan fisik prima, dan mandiri finansial di tahun 2026';

const getTodayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatReadableDateShort = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTabState] = useState<TabType>('inbox');

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'inbox' ? '/inbox' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, []);

  // Sinkronisasi tab dengan path URL browser (/inbox, /today, /calendar, /ai, /account)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTabWithUrl = () => {
      const rawPath = window.location.pathname.replace(/^\//, '').split('/')[0];
      const validTabs: TabType[] = ['inbox', 'calendar', 'today', 'ai', 'account'];
      if (validTabs.includes(rawPath as TabType)) {
        setActiveTabState(rawPath as TabType);
      } else if (!rawPath || rawPath === '') {
        setActiveTabState('inbox');
        window.history.replaceState(null, '', '/inbox');
      }
    };

    syncTabWithUrl();

    const handlePopState = () => {
      syncTabWithUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate(0));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // State Pengaturan Goal Hidup & Personalisasi
  const [userGoal, setUserGoal] = useState<string>(DEFAULT_LIFE_GOAL);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // State Analisis AI & Jam Biologis
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  // State Cloudflare KV Sync & Akun Pengguna
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastCloudSyncedAt, setLastCloudSyncedAt] = useState<string | null>(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);

  // State Jadwal Asli & Proposal AI untuk Komparasi Sebelum/Sesudah
  const [originalSchedules, setOriginalSchedules] = useState<Record<string, Task[]>>({});
  const [aiProposals, setAiProposals] = useState<Record<string, Task[]>>({});
  const [activeScheduleModes, setActiveScheduleModes] = useState<Record<string, 'original' | 'ai'>>({});

  // Mode Jadwal Paralel (Versi Ori vs Versi AI - 1x Klik Berpindah)
  const [activeScheduleVersion, setActiveScheduleVersion] = useState<'ori' | 'ai'>('ori');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      const todayStr = getTodayDateString();

      const isDemoDismissed = localStorage.getItem('ten_tasks_demo_dismissed') === 'true';

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Pastikan jika belum ada isToday, isi minimal 3 tugas pertama sebagai Today demo (selama bukan kegiatan beda hari)
          const hasAnyToday = parsed.some((t: Task) => t.isToday);
          if (!hasAnyToday) {
            const upgraded = parsed.map((t: Task, idx: number) => {
              const taskDate = t.startDate || t.dueDate;
              const isOtherDayEvent =
                t.inboxType === 'kegiatan' &&
                Boolean(t.startTime || t.endTime || t.dueTime) &&
                Boolean(taskDate && taskDate !== todayStr);
              const shouldBeToday = idx < 3 && !isOtherDayEvent;
              return {
                ...t,
                isToday: shouldBeToday,
                todayOrder: shouldBeToday ? idx + 1 : undefined,
              };
            });
            setTasks(upgraded);
          } else {
            // Sanitasi: pastikan kegiatan dengan waktu mulai/selesai yang bukan hari ini tidak berstatus isToday
            const sanitized = parsed.map((t: Task) => {
              const taskDate = t.startDate || t.dueDate;
              const isOtherDayEvent =
                t.inboxType === 'kegiatan' &&
                Boolean(t.startTime || t.endTime || t.dueTime) &&
                Boolean(taskDate && taskDate !== todayStr);
              if (isOtherDayEvent && t.isToday) {
                return { ...t, isToday: false, todayOrder: undefined };
              }
              return t;
            });
            setTasks(sanitized);
          }
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          setTasks(isDemoDismissed ? [] : INITIAL_TASKS);
        } else {
          setTasks(isDemoDismissed ? [] : INITIAL_TASKS);
        }
      } else {
        setTasks(isDemoDismissed ? [] : INITIAL_TASKS);
      }

      // Load saved AI Analysis
      const savedAnalysis = localStorage.getItem(STORAGE_ANALYSIS_KEY);
      if (savedAnalysis) {
        setAiAnalysis(JSON.parse(savedAnalysis));
      }

      // Load saved User Goal
      const savedGoal = localStorage.getItem(STORAGE_GOAL_KEY);
      if (savedGoal && savedGoal.trim()) {
        setUserGoal(savedGoal);
      } else if (isDemoDismissed) {
        setUserGoal('');
      }

      // Load saved Original Schedules
      const savedOriginals = localStorage.getItem(STORAGE_ORIGINAL_KEY);
      if (savedOriginals) {
        setOriginalSchedules(JSON.parse(savedOriginals));
      }

      // Load saved Schedule Version (Ori vs AI)
      const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (savedVersion === 'ai' || savedVersion === 'ori') {
        setActiveScheduleVersion(savedVersion);
      }

      // Load saved User Profile (Cloudflare KV Sync)
      const savedUser = cloudSyncService.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
      const savedSyncTime = localStorage.getItem('ten_my_id_last_sync_v01');
      if (savedSyncTime) {
        setLastCloudSyncedAt(savedSyncTime);
      }
      const savedAutoSync = localStorage.getItem('ten_my_id_autosync_v01');
      if (savedAutoSync !== null) {
        setIsAutoSyncEnabled(savedAutoSync === 'true');
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage, menggunakan data seed:', e);
      setTasks(INITIAL_TASKS);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Auto-sync debounced ke Task_KV ketika tasks berubah jika currentUser & isAutoSyncEnabled aktif
  useEffect(() => {
    if (!isHydrated || !currentUser || !isAutoSyncEnabled) return;

    const timer = setTimeout(() => {
      setIsSyncingCloud(true);
      cloudSyncService.pushTasks(currentUser.email, tasks, userGoal).then((res) => {
        if (res.success && res.updatedAt) {
          setLastCloudSyncedAt(res.updatedAt);
          try {
            localStorage.setItem('ten_my_id_last_sync_v01', res.updatedAt);
          } catch {}
        }
      }).finally(() => {
        setIsSyncingCloud(false);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [tasks, userGoal, currentUser, isAutoSyncEnabled, isHydrated]);

  // Sync tasks to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {
        console.error('Gagal menyimpan ke localStorage:', e);
      }
    }
  }, [tasks, isHydrated]);

  // Sync originalSchedules to localStorage
  useEffect(() => {
    if (isHydrated && Object.keys(originalSchedules).length > 0) {
      try {
        localStorage.setItem(STORAGE_ORIGINAL_KEY, JSON.stringify(originalSchedules));
      } catch (e) {
        console.error('Gagal menyimpan originalSchedules ke localStorage:', e);
      }
    }
  }, [originalSchedules, isHydrated]);

  // Sync activeScheduleVersion to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_VERSION_KEY, activeScheduleVersion);
      } catch (e) {
        console.error('Gagal menyimpan activeScheduleVersion ke localStorage:', e);
      }
    }
  }, [activeScheduleVersion, isHydrated]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2800);
  }, []);

  // Fitur 5 Tugas Fokus Today
  const todayTasks = tasks.filter((t) => t.isToday).slice(0, 5);

  const addToToday = useCallback(
    (taskId: string): boolean => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      // Aturan Konsistensi: Inbox berjenis acara/kegiatan yang sudah terjadwal (memiliki waktu mulai/selesai)
      // dilarang masuk ke Today jika tanggal acaranya bukan hari ini!
      const todayStr = getTodayDateString();
      const taskDate = task.startDate || task.dueDate;
      const isKegiatan = task.inboxType === 'kegiatan';
      const hasScheduledTime = Boolean(task.startTime || task.endTime || task.dueTime);

      if (isKegiatan && hasScheduledTime && taskDate && taskDate !== todayStr) {
        const readableDate = formatReadableDateShort(taskDate);
        showToast(
          `Acara/kegiatan ini terjadwal pada ${readableDate}. Hanya acara yang berlangsung hari ini yang dapat dimasukkan ke Today.`
        );
        return false;
      }

      const currentTodayCount = tasks.filter((t) => t.isToday).length;
      if (currentTodayCount >= 5) {
        showToast('Maksimal 5 tugas untuk Today! Keluarkan salah satu tugas terlebih dahulu.');
        return false;
      }
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, isToday: true, todayOrder: currentTodayCount + 1, todayDaysCount: t.todayDaysCount || 1 }
            : t
        )
      );
      showToast('Tugas dipilih ke Today ⭐');
      return true;
    },
    [tasks, showToast]
  );

  const removeFromToday = useCallback(
    (taskId: string) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, isToday: false, todayOrder: undefined, todayDaysCount: undefined } : t
        )
      );
      showToast('Tugas dikeluarkan dari Today');
    },
    [showToast]
  );

  const toggleTodayTask = useCallback(
    (taskId: string): boolean => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;
      if (task.isToday) {
        removeFromToday(taskId);
        return false;
      } else {
        return addToToday(taskId);
      }
    },
    [tasks, addToToday, removeFromToday]
  );

  // Logika Rollover Tengah Malam (Melewati Jam 12 Malam)
  const applyMidnightRollover = useCallback((targetNewDateStr?: string) => {
    const todayStr = targetNewDateStr || getTodayDateString();

    setTasks((prevTasks) => {
      const currentTodayList = prevTasks.filter((t) => t.isToday).slice(0, 5);

      // 1. Simpan riwayat kemarin ke localStorage ('today_daily_completion_logs_v1')
      try {
        const STORAGE_HISTORY = 'today_daily_completion_logs_v1';
        const saved = localStorage.getItem(STORAGE_HISTORY);
        const logs: any[] = saved ? JSON.parse(saved) : [];

        const lastActiveDate = localStorage.getItem('ten_my_id_last_today_active_date') || getFormattedDate(-1);
        const [y, m, d] = lastActiveDate.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));

        const completedCount = currentTodayList.filter((t) => t.isCompleted).length;
        const taskDetails = currentTodayList.map((t) => ({
          id: t.id,
          title: t.title,
          isCompleted: t.isCompleted,
          todayDaysCount: t.todayDaysCount || 1,
        }));

        const logEntry = {
          date: lastActiveDate,
          dayName: dateObj.toLocaleDateString('id-ID', { weekday: 'long' }),
          formattedDate: dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          totalSlots: 5,
          completedCount,
          tasks: taskDetails,
        };

        const existingIdx = logs.findIndex((l) => l.date === lastActiveDate);
        if (existingIdx >= 0) {
          logs[existingIdx] = logEntry;
        } else {
          logs.unshift(logEntry);
        }
        logs.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(logs));
      } catch (e) {
        console.error('Gagal mencatat riwayat rollover:', e);
      }

      // 2. Bersihkan tugas selesai dari Today (isToday: false)
      //    Tugas yang belum selesai tetap di Today, dan count hari berada di Today bertambah (+1)
      return prevTasks.map((t) => {
        if (!t.isToday) return t;
        if (t.isCompleted) {
          return {
            ...t,
            isToday: false,
            todayOrder: undefined,
          };
        }
        return {
          ...t,
          todayDaysCount: (t.todayDaysCount || 1) + 1,
        };
      });
    });

    try {
      localStorage.setItem('ten_my_id_last_today_active_date', todayStr);
    } catch {}
  }, []);

  // Periksa rollover otomatis pada load & setiap 60 detik
  useEffect(() => {
    if (!isHydrated) return;
    const checkDate = () => {
      const todayStr = getTodayDateString();
      const lastActiveDate = localStorage.getItem('ten_my_id_last_today_active_date');
      if (lastActiveDate && lastActiveDate !== todayStr) {
        applyMidnightRollover(todayStr);
        showToast('Hari baru dimulai! Tugas Today yang selesai diarsipkan, tugas berlanjut diperbarui 🌅');
      } else if (!lastActiveDate) {
        localStorage.setItem('ten_my_id_last_today_active_date', todayStr);
      }
    };

    checkDate();
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [isHydrated, applyMidnightRollover, showToast]);

  // Fungsi Simulasi untuk mempermudah testing user
  const simulateMidnightRollover = useCallback(() => {
    applyMidnightRollover();
    showToast('⚡ Simulasi ganti hari berhasil! Tugas selesai diarsipkan, tugas belum selesai berlanjut ke hari berikutnya.');
  }, [applyMidnightRollover, showToast]);

  // Fitur Perekaman Waktu Pengerjaan / Stopwatch Aktivitas
  const startTaskTimer = useCallback((taskId: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isTimerRunning: true,
            timerStartedAt: nowIso,
          };
        }
        // Jeda tugas lain jika ada yang sedang berjalan (single focused activity)
        if (t.isTimerRunning && t.timerStartedAt) {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(t.timerStartedAt).getTime()) / 1000));
          return {
            ...t,
            isTimerRunning: false,
            timerStartedAt: undefined,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + elapsed,
          };
        }
        return t;
      })
    );
    showToast('Aktivitas dimulai! Stopwatch pengerjaan sedang berjalan ⏱️▶️');
  }, [showToast]);

  const pauseTaskTimer = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.isTimerRunning && t.timerStartedAt) {
          const elapsed = Math.max(0, Math.floor((Date.now() - new Date(t.timerStartedAt).getTime()) / 1000));
          return {
            ...t,
            isTimerRunning: false,
            timerStartedAt: undefined,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + elapsed,
          };
        }
        return t;
      })
    );
    showToast('Waktu pengerjaan dijeda ⏸️');
  }, [showToast]);

  const stopTaskTimer = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          let extra = 0;
          if (t.isTimerRunning && t.timerStartedAt) {
            extra = Math.max(0, Math.floor((Date.now() - new Date(t.timerStartedAt).getTime()) / 1000));
          }
          return {
            ...t,
            isTimerRunning: false,
            timerStartedAt: undefined,
            timeSpentSeconds: (t.timeSpentSeconds || 0) + extra,
          };
        }
        return t;
      })
    );
    showToast('Perekaman waktu dihentikan & tersimpan ⏹️');
  }, [showToast]);

  const resetTaskTimer = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isTimerRunning: false,
              timerStartedAt: undefined,
              timeSpentSeconds: 0,
            }
          : t
      )
    );
    showToast('Hitungan waktu aktivitas di-reset ke 0');
  }, [showToast]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Task "${newTask.title.slice(0, 20)}..." berhasil dibuat!`);
    setActiveTab('inbox');
    setIsTaskFormOpen(false);
  }, [showToast]);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setEditingTask(null);
    showToast('Task berhasil diperbarui!');
  }, [showToast]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Tugas berhasil dihapus');
  }, [showToast]);

  const clearAllCompletedTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.isCompleted));
    showToast('Semua riwayat tugas selesai telah dibersihkan');
  }, [showToast]);

  const toggleTaskStatus = useCallback((taskId: string) => {
    setTasks((prev) => {
      let recurringTaskToSpawn: Task | null = null;

      const updated = prev.map((task) => {
        if (task.id === taskId) {
          const nextStatus = !task.isCompleted;
          const updatedSubTasks = task.subTasks.map((st) => ({
            ...st,
            isCompleted: nextStatus,
          }));

          // Hentikan timer jika sedang berjalan dan akumulasikan waktu
          let finalTimeSpent = task.timeSpentSeconds || 0;
          if (task.isTimerRunning && task.timerStartedAt) {
            const extra = Math.max(
              0,
              Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
            );
            finalTimeSpent += extra;
          }

          if (nextStatus) {
            const formatDurationText = (sec: number): string => {
              const h = Math.floor(sec / 3600);
              const m = Math.floor((sec % 3600) / 60);
              const s = sec % 60;
              if (h > 0) return `${h} jam ${m} mnt`;
              if (m > 0) return `${m} mnt ${s} dtk`;
              return `${s} dtk`;
            };

            const durationNotice =
              finalTimeSpent > 0 ? ` (Waktu: ${formatDurationText(finalTimeSpent)})` : '';

            if (task.recurrence && task.recurrence !== 'none') {
              // Hitung tanggal berikutnya
              const calculateNextDate = (currentDateStr: string, recurrence: RecurrenceType): string => {
                const parts = currentDateStr.split('-');
                const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
                if (recurrence === 'daily') {
                  d.setDate(d.getDate() + 1);
                } else if (recurrence === 'weekdays') {
                  const day = d.getDay();
                  if (day === 5) d.setDate(d.getDate() + 3);
                  else if (day === 6) d.setDate(d.getDate() + 2);
                  else d.setDate(d.getDate() + 1);
                } else if (recurrence === 'weekly') {
                  d.setDate(d.getDate() + 7);
                } else if (recurrence === 'monthly') {
                  d.setMonth(d.getMonth() + 1);
                }
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dateNum = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${dateNum}`;
              };

              const nextDueDate = calculateNextDate(task.dueDate || new Date().toISOString().split('T')[0], task.recurrence);
              recurringTaskToSpawn = {
                ...task,
                id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                dueDate: nextDueDate,
                startDate: task.startDate ? calculateNextDate(task.startDate, task.recurrence) : nextDueDate,
                endDate: task.endDate ? calculateNextDate(task.endDate, task.recurrence) : nextDueDate,
                isCompleted: false,
                completedAt: undefined,
                subTasks: task.subTasks.map((st) => ({ ...st, isCompleted: false })),
                createdAt: new Date().toISOString(),
              };
              showToast(`Tugas rutin selesai! Siklus berikutnya aktif untuk tanggal ${nextDueDate}${durationNotice} 🔁`);
            } else {
              showToast(`Tugas selesai & dipindahkan ke Riwayat${durationNotice} 🎉`);
            }
          } else {
            showToast(`Tugas dikembalikan ke Inbox 📥`);
          }

          return {
            ...task,
            isCompleted: nextStatus,
            completedAt: nextStatus ? new Date().toISOString() : undefined,
            isTimerRunning: false,
            timerStartedAt: undefined,
            timeSpentSeconds: finalTimeSpent,
            subTasks: updatedSubTasks,
          };
        }
        return task;
      });

      if (recurringTaskToSpawn) {
        return [recurringTaskToSpawn, ...updated];
      }
      return updated;
    });
  }, [showToast]);

  const toggleSubTaskStatus = useCallback((taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedSubTasks = task.subTasks.map((st) =>
            st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
          );
          const allCompleted =
            updatedSubTasks.length > 0 &&
            updatedSubTasks.every((st) => st.isCompleted);
          return {
            ...task,
            subTasks: updatedSubTasks,
            isCompleted: allCompleted ? true : task.isCompleted,
          };
        }
        return task;
      })
    );
  }, []);

  const addAISubTasks = useCallback((taskId: string, subTaskTitles: string[]) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const generatedSubs: SubTask[] = subTaskTitles.map((title, i) => ({
            id: `sub-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
            title,
            isCompleted: false,
          }));
          return {
            ...task,
            subTasks: [...task.subTasks, ...generatedSubs],
          };
        }
        return task;
      })
    );
    showToast(`Berhasil menambahkan ${subTaskTitles.length} sub-tugas AI! ✨`);
  }, [showToast]);

  const saveUserGoal = useCallback((goal: string) => {
    const trimmed = goal.trim();
    setUserGoal(trimmed);
    try {
      localStorage.setItem(STORAGE_GOAL_KEY, trimmed);
      showToast('Goals tahunan berhasil disimpan! 🎯');
    } catch (e) {
      console.error('Gagal menyimpan goal:', e);
    }
  }, [showToast]);

  const addAISubTasksAndEstimate = useCallback(
    (
      taskId: string,
      subTaskTitles: string[],
      estimatedTime: string,
      goalAlignmentScore?: number,
      goalAlignmentReason?: string
    ) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === taskId) {
            const generatedSubs: SubTask[] = subTaskTitles.map((title, i) => ({
              id: `sub-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
              title,
              isCompleted: false,
            }));
            return {
              ...task,
              estimatedTime,
              goalAlignmentScore:
                goalAlignmentScore !== undefined
                  ? goalAlignmentScore
                  : task.goalAlignmentScore,
              goalAlignmentReason:
                goalAlignmentReason || task.goalAlignmentReason,
              subTasks: [...task.subTasks, ...generatedSubs],
            };
          }
          return task;
        })
      );
      const scoreNotice =
        goalAlignmentScore !== undefined
          ? ` (Skor Goal: ${goalAlignmentScore > 0 ? '+' : ''}${goalAlignmentScore})`
          : '';
      showToast(
        `AI: +${subTaskTitles.length} sub-tugas, estimasi ${estimatedTime}${scoreNotice}! ✨`
      );
    },
    [showToast]
  );

  // Fitur Analisis AI: 1-Click & Tersimpan di Lokal
  const runTaskAnalysis = useCallback(async () => {
    if (tasks.length === 0) {
      showToast('Tambahkan tugas terlebih dahulu sebelum menjalankan analisis.');
      return;
    }
    setIsAnalyzingAI(true);
    try {
      const result = await analyzeTasksWithCircadianAI(tasks, userGoal);
      setAiAnalysis(result);
      localStorage.setItem(STORAGE_ANALYSIS_KEY, JSON.stringify(result));

      // Sekaligus perbarui goalAlignmentScore di tiap task
      if (result.tasksAnalysis && result.tasksAnalysis.length > 0) {
        setTasks((prev) =>
          prev.map((t) => {
            const matched = result.tasksAnalysis.find((a) => a.taskId === t.id);
            if (matched && matched.goalAlignmentScore !== undefined) {
              return {
                ...t,
                goalAlignmentScore: matched.goalAlignmentScore,
                goalAlignmentReason: matched.reason,
              };
            }
            return t;
          })
        );
      }

      showToast('Analisis prioritas, jam biologis & keselarasan goals selesai! 🧠🎯');
    } catch (err: any) {
      console.error('Error running AI task analysis:', err);
      showToast(err.message || 'Gagal menganalisis tugas. Periksa koneksi internet.');
    } finally {
      setIsAnalyzingAI(false);
    }
  }, [tasks, userGoal, showToast]);

  const clearAnalysis = useCallback(() => {
    setAiAnalysis(null);
    localStorage.removeItem(STORAGE_ANALYSIS_KEY);
    showToast('Analisis dihapus dari penyimpanan lokal.');
  }, [showToast]);

  const hasOriginalSnapshot = useCallback(
    (dateStr: string) => {
      return Boolean(originalSchedules[dateStr] && originalSchedules[dateStr].length > 0);
    },
    [originalSchedules]
  );

  const hasAiProposal = useCallback(
    (dateStr: string) => {
      return Boolean(aiProposals[dateStr] && aiProposals[dateStr].length > 0);
    },
    [aiProposals]
  );

  const toggleScheduleMode = useCallback((dateStr: string, mode: 'original' | 'ai') => {
    setActiveScheduleModes((prev) => ({ ...prev, [dateStr]: mode }));
  }, []);

  const previewAiSchedule = useCallback(
    (dateStr: string): ScheduleComparisonResult | null => {
      let orig = originalSchedules[dateStr];
      if (!orig || orig.length === 0) {
        orig = tasks.filter((t) => t.dueDate === dateStr && !t.isBreakTask);
        if (orig.length > 0) {
          setOriginalSchedules((prev) => ({ ...prev, [dateStr]: orig }));
        }
      }

      if (orig.length === 0) {
        showToast('Tidak ada tugas pada tanggal ini untuk dijadwalkan.');
        return null;
      }

      const aiScheduled = scheduleDailyTasksSmartly(orig);
      setAiProposals((prev) => ({ ...prev, [dateStr]: aiScheduled }));
      return compareSchedules(orig, aiScheduled);
    },
    [originalSchedules, tasks, showToast]
  );

  const applyAiSchedule = useCallback(
    (dateStr: string) => {
      let proposal = aiProposals[dateStr];
      let orig = originalSchedules[dateStr];

      if (!orig || orig.length === 0) {
        orig = tasks.filter((t) => t.dueDate === dateStr && !t.isBreakTask);
        setOriginalSchedules((prev) => ({ ...prev, [dateStr]: orig }));
      }

      if (!proposal || proposal.length === 0) {
        if (orig.length === 0) {
          showToast('Tidak ada tugas pada tanggal ini.');
          return;
        }
        proposal = scheduleDailyTasksSmartly(orig);
        setAiProposals((prev) => ({ ...prev, [dateStr]: proposal }));
      }

      setTasks((prev) => {
        const otherDayTasks = prev.filter((t) => t.dueDate !== dateStr);
        return [...otherDayTasks, ...proposal];
      });

      setActiveScheduleModes((prev) => ({ ...prev, [dateStr]: 'ai' }));
      const hasBreak = proposal.some((t) => t.isBreakTask);
      if (hasBreak) {
        showToast('Jadwal AI & Jeda Istirahat Energi berhasil diterapkan! ⚡☕');
      } else {
        showToast('Jadwal AI berhasil diterapkan tanpa bentrok! ⚡📅');
      }
    },
    [aiProposals, originalSchedules, tasks, showToast]
  );

  const revertToOriginal = useCallback(
    (dateStr: string) => {
      const orig = originalSchedules[dateStr];
      if (orig && orig.length > 0) {
        setTasks((prev) => {
          const otherDayTasks = prev.filter((t) => t.dueDate !== dateStr);
          return [...otherDayTasks, ...orig];
        });
      } else {
        setTasks((prev) => prev.filter((t) => !(t.dueDate === dateStr && t.isBreakTask)));
      }

      setActiveScheduleModes((prev) => ({ ...prev, [dateStr]: 'original' }));
      showToast('Jadwal dikembalikan ke susunan asli (sebelum AI) 📋');
    },
    [originalSchedules, showToast]
  );

  const refreshAiSchedule = useCallback(
    (dateStr: string): ScheduleComparisonResult | null => {
      const baseline =
        originalSchedules[dateStr] && originalSchedules[dateStr].length > 0
          ? originalSchedules[dateStr]
          : tasks.filter((t) => t.dueDate === dateStr && !t.isBreakTask);

      if (baseline.length === 0) {
        showToast('Tidak ada tugas pada tanggal ini untuk diperbarui.');
        return null;
      }

      const freshAi = scheduleDailyTasksSmartly(baseline);
      setAiProposals((prev) => ({ ...prev, [dateStr]: freshAi }));
      showToast('Rekomendasi AI berhasil diperbarui dengan data terkini! 🔄⚡');
      return compareSchedules(baseline, freshAi);
    },
    [originalSchedules, tasks, showToast]
  );

  const getComparisonForDate = useCallback(
    (dateStr: string): ScheduleComparisonResult | null => {
      const orig =
        originalSchedules[dateStr] ||
        tasks.filter((t) => t.dueDate === dateStr && !t.isBreakTask);
      const ai =
        aiProposals[dateStr] ||
        (orig.length > 0 ? scheduleDailyTasksSmartly(orig) : []);
      if (orig.length === 0 && ai.length === 0) return null;
      return compareSchedules(orig, ai);
    },
    [originalSchedules, aiProposals, tasks]
  );

  const autoScheduleDay = useCallback(
    (dateStr: string) => {
      applyAiSchedule(dateStr);
    },
    [applyAiSchedule]
  );

  const addRecoveryBreak = useCallback(
    (
      dateStr: string,
      type: 'lunch' | 'hydration' | 'afternoon' | 'dinner',
      startTimeStr: string = '12:00'
    ) => {
      const duration = type === 'lunch' || type === 'dinner' ? 45 : 15;
      const breakTask = createSmartBreakTask(dateStr, type, startTimeStr, duration);
      setTasks((prev) => [breakTask, ...prev]);
      showToast(`Jeda istirahat "${breakTask.title}" ditambahkan! ☕`);
    },
    [showToast]
  );

  const toggleScheduleVersion = useCallback(() => {
    setActiveScheduleVersion((prev) => {
      const next = prev === 'ori' ? 'ai' : 'ori';
      showToast(next === 'ai' ? 'Beralih ke Versi AI (Jadwal Teroptimasi) ⚡' : 'Beralih ke Versi Ori (Jadwal Asli) 📋');
      return next;
    });
  }, [showToast]);

  const getTasksForDateAndVersion = useCallback(
    (dateStr: string, version: 'ori' | 'ai' = activeScheduleVersion): Task[] => {
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

      if (version === 'ori') {
        // Versi Ori: tampilkan tugas asli pengguna (hilangkan tugas jeda istirahat otomatis)
        return dayTasks.filter((t) => !t.isBreakTask || t.breakType === 'custom');
      }

      // Versi AI: ambil tugas non-break, lalu susun secara cerdas menggunakan smartScheduler
      const nonBreakTasks = dayTasks.filter((t) => !t.isBreakTask);
      if (nonBreakTasks.length === 0) {
        return dayTasks;
      }
      return scheduleDailyTasksSmartly(nonBreakTasks);
    },
    [tasks, activeScheduleVersion]
  );

  const resetToSampleData = useCallback(() => {
    setTasks(INITIAL_TASKS);
    setOriginalSchedules({});
    setAiProposals({});
    setActiveScheduleModes({});
    setActiveScheduleVersion('ori');
    try {
      localStorage.removeItem(STORAGE_ORIGINAL_KEY);
      localStorage.removeItem(STORAGE_VERSION_KEY);
    } catch {}
    showToast('Data direset ke data contoh');
  }, [showToast]);

  const clearAllTasksAndStartFresh = useCallback(() => {
    setTasks([]);
    setAiAnalysis(null);
    setUserGoal('');
    setOriginalSchedules({});
    setAiProposals({});
    setActiveScheduleModes({});
    setActiveScheduleVersion('ori');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.removeItem(STORAGE_ANALYSIS_KEY);
      localStorage.removeItem(STORAGE_GOAL_KEY);
      localStorage.removeItem(STORAGE_ORIGINAL_KEY);
      localStorage.removeItem(STORAGE_VERSION_KEY);
      localStorage.setItem('today_daily_completion_logs_v1', JSON.stringify([]));
      localStorage.setItem('ten_tasks_demo_dismissed', 'true');
      localStorage.removeItem('ten_tasks_demo_snooze_until');
      // Kirim event agar komponen yang mengamati storage (seperti riwayat) langsung sinkron
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Gagal membersihkan data tugas:', e);
    }
    showToast('Semua data tugas, riwayat, dan analisis AI telah dibersihkan! ✨');
  }, [showToast]);

  // 1. Register User ke Task_KV
  // 1. Register User ke Task_KV
  const registerUser = useCallback(
    async (name: string, email: string, password: string, mergeLocalData = true, recoveryPin?: string) => {
      setIsSyncingCloud(true);
      try {
        const result = await cloudSyncService.register(
          name,
          email,
          password,
          mergeLocalData ? tasks : undefined,
          mergeLocalData ? userGoal : undefined,
          recoveryPin
        );

        if (result.success && result.user) {
          setCurrentUser(result.user);
          const nowStr = new Date().toISOString();
          setLastCloudSyncedAt(nowStr);
          try {
            localStorage.setItem('ten_my_id_last_sync_v01', nowStr);
          } catch {}
          showToast(`Selamat datang ${result.user.name}! Akun terhubung ke Cloud.`);
          return { success: true };
        } else {
          showToast(result.error || 'Gagal mendaftar');
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        showToast(err.message || 'Terjadi kesalahan');
        return { success: false, error: err.message };
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [tasks, userGoal, showToast]
  );

  // 2. Login User ke Task_KV
  const loginUser = useCallback(
    async (email: string, password: string, mergeLocalData = true) => {
      setIsSyncingCloud(true);
      try {
        const result = await cloudSyncService.login(email, password);
        if (result.success && result.user) {
          setCurrentUser(result.user);
          const nowStr = new Date().toISOString();
          setLastCloudSyncedAt(nowStr);
          try {
            localStorage.setItem('ten_my_id_last_sync_v01', nowStr);
          } catch {}

          if (result.cloudData && result.cloudData.tasks && result.cloudData.tasks.length > 0) {
            if (mergeLocalData) {
              const cloudTaskIds = new Set(result.cloudData.tasks.map((t: Task) => t.id));
              const uniqueLocalTasks = tasks.filter((t) => !cloudTaskIds.has(t.id));
              const merged = [...result.cloudData.tasks, ...uniqueLocalTasks];
              setTasks(merged);
              await cloudSyncService.pushTasks(result.user.email, merged, result.cloudData.userGoal || userGoal);
            } else {
              setTasks(result.cloudData.tasks);
              if (result.cloudData.userGoal) {
                setUserGoal(result.cloudData.userGoal);
              }
            }
          } else if (mergeLocalData && tasks.length > 0) {
            await cloudSyncService.pushTasks(result.user.email, tasks, userGoal);
          }

          showToast(`Berhasil masuk sebagai ${result.user.name}. Data tersinkron ke Cloud.`);
          return { success: true };
        } else {
          showToast(result.error || 'Gagal masuk akun');
          return { success: false, error: result.error };
        }
      } catch (err: any) {
        showToast(err.message || 'Terjadi kesalahan');
        return { success: false, error: err.message };
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [tasks, userGoal, showToast]
  );

  // 3. Verifikasi PIN Pemulihan
  const verifyRecoveryPin = useCallback(
    async (email: string, recoveryPin: string) => {
      try {
        const res = await cloudSyncService.verifyRecoveryPin(email, recoveryPin);
        return res;
      } catch (err: any) {
        return { success: false, error: err.message || 'Gagal memverifikasi PIN' };
      }
    },
    []
  );

  // 4. Reset Kata Sandi Baru
  const resetPasswordUser = useCallback(
    async (email: string, recoveryPin: string, newPassword: string) => {
      try {
        const res = await cloudSyncService.resetPassword(email, recoveryPin, newPassword);
        if (res.success) {
          showToast('Kata sandi berhasil diperbarui! Silakan masuk akun.');
        } else {
          showToast(res.error || 'Gagal mereset kata sandi');
        }
        return res;
      } catch (err: any) {
        showToast(err.message || 'Terjadi kesalahan');
        return { success: false, error: err.message };
      }
    },
    [showToast]
  );

  // 5. Update Profil Pengguna
  const updateUserProfile = useCallback(
    async (name?: string, oldPassword?: string, newPassword?: string, recoveryPin?: string) => {
      if (!currentUser) return { success: false, error: 'Tidak ada sesi akun aktif' };
      try {
        const res = await cloudSyncService.updateProfile(
          currentUser.email,
          name,
          oldPassword,
          newPassword,
          recoveryPin
        );
        if (res.success && res.user) {
          setCurrentUser(res.user);
          showToast('Profil akun berhasil diperbarui.');
          return { success: true };
        } else {
          showToast(res.error || 'Gagal memperbarui profil');
          return { success: false, error: res.error };
        }
      } catch (err: any) {
        showToast(err.message || 'Terjadi kesalahan');
        return { success: false, error: err.message };
      }
    },
    [currentUser, showToast]
  );

  // 6. Logout
  const logoutUser = useCallback(
    (clearLocalTasks = false) => {
      cloudSyncService.logout();
      setCurrentUser(null);
      setLastCloudSyncedAt(null);
      try {
        localStorage.removeItem('ten_my_id_last_sync_v01');
      } catch {}

      if (clearLocalTasks) {
        setTasks([]);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        } catch {}
        showToast('Telah keluar dari akun dan data lokal dibersihkan.');
      } else {
        showToast('Telah keluar dari akun. Beroperasi dalam mode Guest lokal.');
      }
    },
    [showToast]
  );

  // 7. Trigger Cloud Sync
  const triggerCloudSync = useCallback(async (): Promise<boolean> => {
    if (!currentUser) {
      showToast('Silakan masuk akun terlebih dahulu untuk sinkronisasi cloud');
      return false;
    }
    setIsSyncingCloud(true);
    try {
      const res = await cloudSyncService.pushTasks(currentUser.email, tasks, userGoal);
      if (res.success) {
        const nowStr = res.updatedAt || new Date().toISOString();
        setLastCloudSyncedAt(nowStr);
        try {
          localStorage.setItem('ten_my_id_last_sync_v01', nowStr);
        } catch {}
        showToast('Data berhasil dicadangkan dan disinkronkan ke Cloud');
        return true;
      } else {
        showToast(res.error || 'Gagal sinkronisasi');
        return false;
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal sinkronisasi cloud');
      return false;
    } finally {
      setIsSyncingCloud(false);
    }
  }, [currentUser, tasks, userGoal, showToast]);

  // 8. Toggle Auto Sync
  const toggleAutoSync = useCallback(() => {
    setIsAutoSyncEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ten_my_id_autosync_v01', String(next));
      } catch {}
      showToast(`Auto-sync cloud ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
      return next;
    });
  }, [showToast]);

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        isSyncingCloud,
        lastCloudSyncedAt,
        isAutoSyncEnabled,
        loginUser,
        registerUser,
        logoutUser,
        triggerCloudSync,
        toggleAutoSync,
        verifyRecoveryPin,
        resetPasswordUser,
        updateUserProfile,
        tasks,
        activeTab,
        setActiveTab,
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedDate,
        setSelectedDate,
        editingTask,
        setEditingTask,
        toastMessage,
        showToast,
        todayTasks,
        toggleTodayTask,
        addToToday,
        removeFromToday,
        simulateMidnightRollover,
        isTaskFormOpen,
        setIsTaskFormOpen,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        clearAllCompletedTasks,
        startTaskTimer,
        pauseTaskTimer,
        stopTaskTimer,
        resetTaskTimer,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubTaskStatus,
        addAISubTasks,
        addAISubTasksAndEstimate,
        aiAnalysis,
        isAnalyzingAI,
        runTaskAnalysis,
        clearAnalysis,
        userGoal,
        setUserGoal,
        saveUserGoal,
        isGoalModalOpen,
        setIsGoalModalOpen,
        autoScheduleDay,
        addRecoveryBreak,
        resetToSampleData,
        clearAllTasksAndStartFresh,
        previewAiSchedule,
        applyAiSchedule,
        revertToOriginal,
        refreshAiSchedule,
        getComparisonForDate,
        hasOriginalSnapshot,
        hasAiProposal,
        activeScheduleModes,
        toggleScheduleMode,
        activeScheduleVersion,
        setActiveScheduleVersion,
        toggleScheduleVersion,
        getTasksForDateAndVersion,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
