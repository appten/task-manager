'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Task,
  TabType,
  FilterStatus,
  SubTask,
  AIAnalysisResult,
  ScheduleComparisonResult,
} from '../types/task';
import { INITIAL_TASKS, getFormattedDate } from '../data/seedTasks';
import { analyzeTasksWithCircadianAI } from '../services/geminiService';
import {
  scheduleDailyTasksSmartly,
  createSmartBreakTask,
  compareSchedules,
} from '../services/smartScheduler';

interface TaskContextType {
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

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate(0));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Pengaturan Goal Hidup & Personalisasi
  const [userGoal, setUserGoal] = useState<string>(DEFAULT_LIFE_GOAL);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // State Analisis AI & Jam Biologis
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

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
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
        } else {
          setTasks(INITIAL_TASKS);
        }
      } else {
        setTasks(INITIAL_TASKS);
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
    } catch (e) {
      console.warn('Gagal membaca localStorage, menggunakan data seed:', e);
      setTasks(INITIAL_TASKS);
    } finally {
      setIsHydrated(true);
    }
  }, []);

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

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Task "${newTask.title.slice(0, 20)}..." berhasil dibuat!`);
    setActiveTab('tasks');
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
    showToast('Task berhasil dihapus');
  }, [showToast]);

  const toggleTaskStatus = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const nextStatus = !task.isCompleted;
          const updatedSubTasks = task.subTasks.map((st) => ({
            ...st,
            isCompleted: nextStatus,
          }));
          return {
            ...task,
            isCompleted: nextStatus,
            subTasks: updatedSubTasks,
          };
        }
        return task;
      })
    );
  }, []);

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

  return (
    <TaskContext.Provider
      value={{
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
