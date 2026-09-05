'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, TabType, FilterStatus, SubTask, AIAnalysisResult } from '../types/task';
import { INITIAL_TASKS, getFormattedDate } from '../data/seedTasks';
import { analyzeTasksWithCircadianAI } from '../services/geminiService';
import { scheduleDailyTasksSmartly } from '../services/smartScheduler';

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
  resetToSampleData: () => void;
}

const STORAGE_KEY = 'ten_my_id_tasks_v01';
const STORAGE_ANALYSIS_KEY = 'ten_my_id_ai_analysis_v01';
const STORAGE_GOAL_KEY = 'ten_my_id_user_goal_v01';

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

  const autoScheduleDay = useCallback(
    (dateStr: string) => {
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      if (dayTasks.length === 0) {
        showToast('Tidak ada tugas pada tanggal ini untuk dijadwalkan.');
        return;
      }

      const scheduled = scheduleDailyTasksSmartly(dayTasks);
      setTasks((prev) =>
        prev.map((t) => {
          if (t.dueDate === dateStr) {
            const found = scheduled.find((s) => s.id === t.id);
            return found || t;
          }
          return t;
        })
      );
      showToast('Jadwal harian AI berhasil disusun tanpa bentrok! ⚡📅');
    },
    [tasks, showToast]
  );

  const resetToSampleData = useCallback(() => {
    setTasks(INITIAL_TASKS);
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
        resetToSampleData,
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
