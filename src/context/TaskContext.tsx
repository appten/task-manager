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
  LifeRelationship,
} from '../types/task';
import { INITIAL_TASKS, getFormattedDate } from '../data/seedTasks';
import { DEFAULT_RELATIONSHIPS } from '../data/seedRelationships';
import { analyzeTasksWithCircadianAI } from '../services/geminiService';
import {
  scheduleDailyTasksSmartly,
  createSmartBreakTask,
  compareSchedules,
} from '../services/smartScheduler';
import { cloudSyncService, UserProfile } from '../services/cloudSyncService';
import { DeviceInfo } from '../services/deviceService';

export type StorageMode = 'cloud_priority' | 'hybrid';

export interface SyncConflictInfo {
  localCount: number;
  cloudCount: number;
  localTasks: Task[];
  cloudTasks: Task[];
  localGoal?: string;
  cloudGoal?: string;
  cloudEmail: string;
}

interface TaskContextType {
  // Cloudflare KV Sync & User Account (Opsional)
  currentUser: UserProfile | null;
  isSyncingCloud: boolean;
  lastCloudSyncedAt: string | null;
  isAutoSyncEnabled: boolean;
  refreshUserSession: () => UserProfile | null;
  syncConflict: SyncConflictInfo | null;
  isReconciling: boolean;
  resolveSyncConflict: (choice: 'merge' | 'use_cloud' | 'use_local') => Promise<void>;
  dismissSyncConflict: () => void;
  // Pengaturan Mode Penyimpanan & Jaringan
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  isAutoOfflineFallbackEnabled: boolean;
  toggleAutoOfflineFallback: () => void;
  isOnline: boolean;
  // Perangkat Terhubung (Multi-Device Sessions)
  activeDevices: DeviceInfo[];
  refreshActiveDevices: () => Promise<void>;
  revokeDeviceSession: (deviceId: string) => Promise<boolean>;
  loginUser: (email: string, password: string, mergeLocalData?: boolean) => Promise<{ success: boolean; error?: string }>;
  registerUser: (name: string, email: string, password: string, mergeLocalData?: boolean, recoveryPin?: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: (clearLocalTasks?: boolean) => void;
  triggerCloudSync: () => Promise<boolean>;
  syncLocalTasksToKV: (mode?: 'merge' | 'push_local' | 'pull_cloud') => Promise<{ success: boolean; count?: number; message?: string }>;
  toggleAutoSync: () => void;
  verifyRecoveryPin: (email: string, recoveryPin: string) => Promise<{ success: boolean; name?: string; error?: string }>;
  resetPasswordUser: (email: string, recoveryPin: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (name?: string, oldPassword?: string, newPassword?: string, recoveryPin?: string) => Promise<{ success: boolean; error?: string }>;
  // Fitur Pencadangan & Pemulihan Data Manual (File JSON)
  exportBackupData: () => void;
  importBackupData: (parsedJson: any, mode: 'merge' | 'replace') => { success: boolean; count: number; error?: string };
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

  // Fitur Peran & Jaga Hubungan (Maks 1 Aktivitas Aktif per Relasi)
  relationships: LifeRelationship[];
  addRelationship: (rel: Omit<LifeRelationship, 'id'>) => void;
  updateRelationship: (rel: LifeRelationship) => void;
  deleteRelationship: (id: string) => void;
  getActiveTaskForRelationship: (relId: string) => Task | undefined;
  addTaskForRelationship: (
    relId: string,
    taskTitle: string,
    dueDate?: string,
    dueTime?: string
  ) => { success: boolean; error?: string };

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
const STORAGE_RELATIONSHIPS_KEY = 'ten_my_id_relationships_v01';

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
      const validTabs: TabType[] = ['inbox', 'pilah', 'today', 'calendar', 'account', 'ai'];
      if (rawPath === 'ai') {
        setActiveTabState('pilah');
        window.history.replaceState(null, '', '/pilah');
      } else if (validTabs.includes(rawPath as TabType)) {
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

  // State Peran & Jaga Hubungan (Maks 1 Tugas Aktif per Relasi)
  const [relationships, setRelationships] = useState<LifeRelationship[]>(DEFAULT_RELATIONSHIPS);

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

  // State Pengaman Sinkronisasi Data Akun (Konflik Data & Rekonsiliasi)
  const [syncConflict, setSyncConflict] = useState<SyncConflictInfo | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const isReconciledRef = React.useRef<boolean>(false);
  const lastReconciledEmailRef = React.useRef<string | null>(null);

  // State Pengaturan Mode Penyimpanan (Cloud-First vs Hybrid) & Auto-Offline Fallback
  const [storageMode, setStorageModeState] = useState<StorageMode>('cloud_priority');
  const [isAutoOfflineFallbackEnabled, setIsAutoOfflineFallbackEnabled] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // State Daftar Perangkat Terhubung (Multi-Device Active Sessions)
  const [activeDevices, setActiveDevices] = useState<DeviceInfo[]>([]);

  // State Jadwal Asli & Proposal AI untuk Komparasi Sebelum/Sesudah
  const [originalSchedules, setOriginalSchedules] = useState<Record<string, Task[]>>({});
  const [aiProposals, setAiProposals] = useState<Record<string, Task[]>>({});
  const [activeScheduleModes, setActiveScheduleModes] = useState<Record<string, 'original' | 'ai'>>({});

  // Mode Jadwal Paralel (Versi Ori vs Versi AI - 1x Klik Berpindah)
  const [activeScheduleVersion, setActiveScheduleVersion] = useState<'ori' | 'ai'>('ori');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2800);
  }, []);

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
      // Load saved User Profile (Cloudflare KV Sync / SSO TEN)
      let savedUser = cloudSyncService.getCurrentUser();
      if (!savedUser) {
        try {
          const raw = localStorage.getItem('ten_cloud_session') || localStorage.getItem('ten_current_user');
          if (raw) {
            const parsed = JSON.parse(raw);
            const u = parsed?.user || parsed;
            if (u && u.email) {
              savedUser = {
                id: u.id || u.sub || u.email,
                name: u.name || 'Pengguna TEN',
                email: u.email,
                username: u.username,
                avatar: u.avatar || u.picture || u.image,
                role: u.role === 'admin' ? 'admin' : 'user',
                authProvider: 'ten-sso',
                createdAt: u.createdAt || new Date().toISOString(),
              };
              cloudSyncService.setCurrentUser(savedUser);
            }
          }
        } catch (e) {
          console.warn('Gagal membaca fallback user:', e);
        }
      }
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
      const savedStorageMode = localStorage.getItem('ten_my_id_storage_mode');
      if (savedStorageMode === 'cloud_priority' || savedStorageMode === 'hybrid') {
        setStorageModeState(savedStorageMode);
      }
      const savedOfflineFallback = localStorage.getItem('ten_my_id_auto_offline_fallback');
      if (savedOfflineFallback !== null) {
        setIsAutoOfflineFallbackEnabled(savedOfflineFallback === 'true');
      }

      // Load saved Life Relationships
      const savedRel = localStorage.getItem(STORAGE_RELATIONSHIPS_KEY);
      if (savedRel) {
        try {
          const parsed = JSON.parse(savedRel);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRelationships(parsed);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Gagal membaca localStorage, menggunakan data seed:', e);
      setTasks(INITIAL_TASKS);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Fungsi publik & reaktif untuk menyegarkan sesi akun dari storage kapan pun
  const refreshUserSession = useCallback((): UserProfile | null => {
    try {
      let u = cloudSyncService.getCurrentUser();
      if (!u) {
        const raw =
          localStorage.getItem('ten_cloud_session') ||
          localStorage.getItem('ten_current_user') ||
          localStorage.getItem('ten_my_id_user_v01');
        if (raw) {
          const parsed = JSON.parse(raw);
          const rawUser = parsed?.user || parsed;
          if (rawUser && (rawUser.email || rawUser.id)) {
            u = {
              id: rawUser.id || rawUser.sub || rawUser.email,
              name: rawUser.name || 'Pengguna TEN',
              email: rawUser.email || '',
              username: rawUser.username,
              avatar: rawUser.avatar || rawUser.picture || rawUser.image,
              role: (rawUser.role === 'admin' ? 'admin' : 'user') as any,
              authProvider: 'ten-sso',
              createdAt: rawUser.createdAt || new Date().toISOString(),
            };
            cloudSyncService.setCurrentUser(u);
          }
        }
      }

      if (u) {
        setCurrentUser((prev) => {
          if (
            prev &&
            prev.email === u!.email &&
            prev.name === u!.name &&
            prev.username === u!.username &&
            prev.role === u!.role &&
            prev.avatar === u!.avatar
          ) {
            return prev;
          }
          return u;
        });
      }
      return u;
    } catch (err) {
      console.warn('Gagal membaca sesi SSO TEN:', err);
      return null;
    }
  }, []);

  // Sinkronisasi sesi SSO TEN secara otomatis & reaktif ke semua jendela/tab/event
  useEffect(() => {
    refreshUserSession();

    // Dengarkan pesan sukses dari popup login SSO TEN
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TEN_SSO_LOGIN_SUCCESS' && event.data?.user) {
        const u = event.data.user;
        const ssoUser: UserProfile = {
          id: u.id || u.sub || u.email,
          name: u.name || 'Pengguna TEN',
          email: u.email || '',
          username: u.username,
          avatar: u.avatar || u.picture || u.image,
          role: (u.role === 'admin' ? 'admin' : 'user') as any,
          authProvider: 'ten-sso',
          createdAt: u.createdAt || new Date().toISOString(),
        };
        setCurrentUser(ssoUser);
        cloudSyncService.setCurrentUser(ssoUser);
        setIsAutoSyncEnabled(true);
        try {
          localStorage.setItem('ten_my_id_autosync_v01', 'true');
        } catch {}
        showToast(`Selamat datang, ${ssoUser.name || ssoUser.username}! Akun terhubung via SSO TEN.`);
      }
    };

    // Dengarkan perubahan storage dari tab/jendela lain
    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === 'ten_my_id_user_v01' ||
        e.key === 'ten_cloud_session' ||
        e.key === 'ten_current_user'
      ) {
        refreshUserSession();
      }
    };

    const handleFocusOrVisible = () => {
      refreshUserSession();
    };

    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('ten_auth_changed', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('ten_auth_changed', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [refreshUserSession, showToast]);

  // Rekonsiliasi data dua arah saat akun berhasil login (mencegah penimpaan data sepihak)
  const reconcileUserDataOnLogin = useCallback(
    async (user: UserProfile) => {
      if (!user?.email) return;
      if (lastReconciledEmailRef.current === user.email && isReconciledRef.current) {
        return;
      }
      setIsReconciling(true);

      try {
        // 1. Simpan cadangan snapshot keselamatan lokal terlebih dahulu sebelum rekonsiliasi
        try {
          const safetySnapshot = {
            timestamp: new Date().toISOString(),
            userEmail: user.email,
            tasks,
            userGoal,
          };
          localStorage.setItem(
            `ten_backup_safety_pre_sync_${user.email}`,
            JSON.stringify(safetySnapshot)
          );
          localStorage.setItem('ten_backup_latest_safety', JSON.stringify(safetySnapshot));
        } catch (snapErr) {
          console.warn('Gagal menyimpan snapshot pengaman data:', snapErr);
        }

        // 2. Tarik data dari Cloud untuk akun ini
        const cloudRes = await cloudSyncService.pullTasks(user.email);
        if (cloudRes.devices) {
          setActiveDevices(cloudRes.devices);
        }
        const cloudTasks = cloudRes.tasks || [];
        const cloudGoal = cloudRes.userGoal || '';

        const localTasks = tasks;

        // Kondisi 1: Cloud kosong, Lokal ada catatan tugas
        if (cloudTasks.length === 0 && localTasks.length > 0) {
          const pushRes = await cloudSyncService.pushTasks(user.email, localTasks, userGoal);
          if (pushRes.devices) setActiveDevices(pushRes.devices);
          isReconciledRef.current = true;
          lastReconciledEmailRef.current = user.email;
          showToast(`Catatan tugas perangkat Anda telah dicadangkan aman ke akun ${user.email}.`);
          return;
        }

        // Kondisi 2: Cloud ada data, Lokal kosong
        if (cloudTasks.length > 0 && localTasks.length === 0) {
          setTasks(cloudTasks);
          if (cloudGoal) setUserGoal(cloudGoal);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudTasks));
          } catch {}
          isReconciledRef.current = true;
          lastReconciledEmailRef.current = user.email;
          showToast(`Berhasil memuat ${cloudTasks.length} catatan tugas dari akun Cloud Anda.`);
          return;
        }

        // Kondisi 3: Keduanya kosong
        if (cloudTasks.length === 0 && localTasks.length === 0) {
          isReconciledRef.current = true;
          lastReconciledEmailRef.current = user.email;
          return;
        }

        // Kondisi 4: Keduanya punya data -> Cek apakah ID dan isinya sama persis
        const cloudIds = new Set(cloudTasks.map((t) => t.id));
        const isSameIds =
          localTasks.length === cloudTasks.length &&
          localTasks.every((t) => cloudIds.has(t.id));

        if (isSameIds) {
          // Data sudah identik
          isReconciledRef.current = true;
          lastReconciledEmailRef.current = user.email;
          return;
        }

        // Kondisi 5: KONFLIK DATA NYATA (Perangkat & Cloud sama-sama punya tugas berbeda)
        // Buka modal dialog pengaman agar pengguna dapat memilih opsi terbaik
        setSyncConflict({
          localCount: localTasks.length,
          cloudCount: cloudTasks.length,
          localTasks,
          cloudTasks,
          localGoal: userGoal,
          cloudGoal,
          cloudEmail: user.email,
        });
      } catch (err: any) {
        console.error('Error saat rekonsiliasi data akun:', err);
      } finally {
        setIsReconciling(false);
      }
    },
    [tasks, userGoal, showToast]
  );

  // Resolusi konflik sinkronisasi sesuai pilihan sadar pengguna
  const resolveSyncConflict = useCallback(
    async (choice: 'merge' | 'use_cloud' | 'use_local') => {
      if (!syncConflict || !currentUser?.email) return;
      setIsReconciling(true);

      try {
        let finalTasks: Task[] = [];
        let finalGoal = userGoal;

        if (choice === 'merge') {
          // GABUNGKAN KEDUA DATA SECARA CERDAS (Merge & Keep Both)
          const mergedMap = new Map<string, Task>();
          // Masukkan tugas dari cloud
          for (const t of syncConflict.cloudTasks) {
            mergedMap.set(t.id, t);
          }
          // Satukan tugas lokal: jika ada ID sama, ambil versi dengan updatedAt terbaru
          for (const lt of syncConflict.localTasks) {
            if (mergedMap.has(lt.id)) {
              const ct = mergedMap.get(lt.id)!;
              const ctTime = new Date(ct.updatedAt || ct.createdAt || 0).getTime();
              const ltTime = new Date(lt.updatedAt || lt.createdAt || 0).getTime();
              if (ltTime >= ctTime) {
                mergedMap.set(lt.id, lt);
              }
            } else {
              mergedMap.set(lt.id, lt);
            }
          }
          finalTasks = Array.from(mergedMap.values());
          finalGoal = syncConflict.cloudGoal || syncConflict.localGoal || userGoal;
          await cloudSyncService.pushTasks(currentUser.email, finalTasks, finalGoal);
          showToast(`Berhasil menggabungkan ${finalTasks.length} tugas (Perangkat & Cloud).`);
        } else if (choice === 'use_cloud') {
          // GUNAKAN DATA CLOUD
          finalTasks = syncConflict.cloudTasks;
          finalGoal = syncConflict.cloudGoal || userGoal;
          showToast(`Menggunakan ${finalTasks.length} tugas dari akun Cloud Anda.`);
        } else if (choice === 'use_local') {
          // GUNAKAN DATA PERANGKAT
          finalTasks = syncConflict.localTasks;
          finalGoal = syncConflict.localGoal || userGoal;
          const pushRes = await cloudSyncService.pushTasks(currentUser.email, finalTasks, finalGoal);
          if (pushRes.devices) setActiveDevices(pushRes.devices);
          showToast(`Menyimpan ${finalTasks.length} tugas dari perangkat ini ke Cloud.`);
        }

        setTasks(finalTasks);
        if (finalGoal) setUserGoal(finalGoal);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalTasks));
          window.dispatchEvent(new Event('storage'));
        } catch {}

        isReconciledRef.current = true;
        lastReconciledEmailRef.current = currentUser.email;
        setSyncConflict(null);
      } catch (err: any) {
        showToast(err.message || 'Gagal menyelesaikan penyesuaian data');
      } finally {
        setIsReconciling(false);
      }
    },
    [syncConflict, currentUser, userGoal, showToast]
  );

  const dismissSyncConflict = useCallback(() => {
    setSyncConflict(null);
    showToast('Penyesuaian ditunda. Data di perangkat dan cloud tetap terpisah aman.');
  }, [showToast]);

  // Pengaturan Mode Penyimpanan (Prioritas Cloud vs Hybrid Offline)
  const setStorageMode = useCallback((mode: StorageMode) => {
    setStorageModeState(mode);
    try {
      localStorage.setItem('ten_my_id_storage_mode', mode);
    } catch {}
    showToast(
      mode === 'cloud_priority'
        ? 'Mode Prioritas Cloud aktif. Perubahan langsung dicadangkan otomatis.'
        : 'Mode Penyimpanan Seimbang (Perangkat & Cloud) aktif.'
    );
  }, [showToast]);

  const toggleAutoOfflineFallback = useCallback(() => {
    setIsAutoOfflineFallbackEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ten_my_id_auto_offline_fallback', String(next));
      } catch {}
      showToast(
        next
          ? 'Peralihan otomatis ke perangkat saat offline diaktifkan.'
          : 'Peralihan otomatis saat offline dinonaktifkan.'
      );
      return next;
    });
  }, [showToast]);

  // Manajemen Perangkat Terhubung (Multi-Device Active Sessions)
  const refreshActiveDevices = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await cloudSyncService.pullTasks(currentUser.email);
      if (res.devices) {
        setActiveDevices(res.devices);
      }
    } catch {}
  }, [currentUser]);

  const revokeDeviceSession = useCallback(
    async (deviceId: string): Promise<boolean> => {
      if (!currentUser?.email) return false;
      try {
        const ok = await cloudSyncService.removeDevice(currentUser.email, deviceId);
        if (ok) {
          setActiveDevices((prev) => prev.filter((d) => d.id !== deviceId));
          showToast('Sesi perangkat berhasil dicabut.');
          return true;
        }
        return false;
      } catch (e: any) {
        showToast(e.message || 'Gagal mencabut sesi perangkat');
        return false;
      }
    },
    [currentUser, showToast]
  );

  // Pantau status koneksi internet (Online / Offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung. Menyinkronkan data...');
      if (currentUser && isAutoSyncEnabled && isReconciledRef.current) {
        cloudSyncService.pushTasks(currentUser.email, tasks, userGoal).then((res) => {
          if (res.devices) setActiveDevices(res.devices);
          if (res.updatedAt) setLastCloudSyncedAt(res.updatedAt);
        }).catch(() => {});
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (isAutoOfflineFallbackEnabled) {
        showToast('Koneksi terputus. Mode offline aktif, catatan disimpan di perangkat Anda.');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, isAutoSyncEnabled, isAutoOfflineFallbackEnabled, tasks, userGoal, showToast]);

  // Pantau login untuk memicu rekonsiliasi data aman
  useEffect(() => {
    if (isHydrated && currentUser?.email) {
      if (lastReconciledEmailRef.current !== currentUser.email) {
        reconcileUserDataOnLogin(currentUser);
      }
    }
  }, [currentUser, isHydrated, reconcileUserDataOnLogin]);

  // Auto-sync debounced ke Task_KV ketika tasks berubah jika currentUser, isAutoSyncEnabled, & status rekonsiliasi aman
  useEffect(() => {
    if (!isHydrated || !currentUser || !isAutoSyncEnabled || !isReconciledRef.current) return;

    const timer = setTimeout(() => {
      setIsSyncingCloud(true);
      cloudSyncService.pushTasks(currentUser.email, tasks, userGoal).then((res) => {
        if (res.devices) {
          setActiveDevices(res.devices);
        }
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

  // Kelola Peran & Relasi (Maksimal 1 Tugas Aktif per Relasi)
  const saveRelationships = useCallback((updated: LifeRelationship[]) => {
    setRelationships(updated);
    try {
      localStorage.setItem(STORAGE_RELATIONSHIPS_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const addRelationship = useCallback(
    (relData: Omit<LifeRelationship, 'id'>) => {
      const newRel: LifeRelationship = {
        ...relData,
        id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      };
      saveRelationships([...relationships, newRel]);
      showToast(`Peran/relasi "${newRel.roleName}" berhasil ditambahkan! 🤝`);
    },
    [relationships, saveRelationships, showToast]
  );

  const updateRelationship = useCallback(
    (updated: LifeRelationship) => {
      const next = relationships.map((r) => (r.id === updated.id ? updated : r));
      saveRelationships(next);
      showToast(`Peran/relasi "${updated.roleName}" diperbarui!`);
    },
    [relationships, saveRelationships, showToast]
  );

  const deleteRelationship = useCallback(
    (id: string) => {
      const next = relationships.filter((r) => r.id !== id);
      saveRelationships(next);
      showToast('Peran/relasi telah dihapus.');
    },
    [relationships, saveRelationships, showToast]
  );

  const getActiveTaskForRelationship = useCallback(
    (relId: string): Task | undefined => {
      return tasks.find((t) => !t.isCompleted && t.relationshipRole === relId);
    },
    [tasks]
  );

  const addTaskForRelationship = useCallback(
    (
      relId: string,
      taskTitle: string,
      dueDate?: string,
      dueTime?: string
    ): { success: boolean; error?: string } => {
      const targetRel = relationships.find((r) => r.id === relId);
      if (!targetRel) {
        return { success: false, error: 'Relasi tidak ditemukan.' };
      }

      const existingActive = tasks.find(
        (t) => !t.isCompleted && t.relationshipRole === relId
      );
      if (existingActive) {
        const msg = `Hubungan "${targetRel.roleName}" sudah memiliki 1 tugas aktif: "${existingActive.title}". Selesaikan tugas ini terlebih dahulu agar perhatian tetap fokus.`;
        showToast(msg);
        return { success: false, error: msg };
      }

      const todayDateStr = getTodayDateString();
      const finalDate = dueDate || todayDateStr;

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        title: taskTitle.trim(),
        description: `Aktivitas fokus menjaga relasi: ${targetRel.roleName}${
          targetRel.personName ? ` (${targetRel.personName})` : ''
        }`,
        inboxType: 'tugas',
        priority: 'medium',
        category: 'Relasi',
        relationshipRole: relId,
        relationshipName: targetRel.roleName,
        dueDate: finalDate,
        dueTime: dueTime || undefined,
        startDate: finalDate,
        endDate: finalDate,
        recurrence: 'none',
        isCompleted: false,
        subTasks: [],
      };

      setTasks((prev) => [newTask, ...prev]);
      showToast(`1 Tugas penting untuk "${targetRel.roleName}" berhasil dicatat! 💖`);
      return { success: true };
    },
    [relationships, tasks, showToast]
  );

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

      if (result.engine === 'custom' || result.sourceType === 'custom') {
        showToast(`Analisis selesai menggunakan Custom AI (${result.engineName || 'Kustom'}) 🤖✨`);
      } else if (result.engine === 'gemini' || result.sourceType === 'ai') {
        showToast(`Analisis selesai menggunakan AI Bawaan (${result.engineName || 'Google Gemini'}) ✨`);
      } else if (result.isFallback) {
        showToast('Koneksi AI terputus, analisis berhasil dialihkan ke Algoritma Sirkadian Lokal ⚡');
      } else {
        showToast('Analisis selesai menggunakan Algoritma Sirkadian Lokal (Offline) ⚡');
      }
    } catch (err: any) {
      console.error('Error running AI task analysis:', err);
      showToast(err?.message || 'Analisis tugas gagal. Periksa koneksi Anda.');
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

  // Fitur Pencadangan Data Manual (Ekspor ke File JSON)
  const exportBackupData = useCallback(() => {
    try {
      let logs = [];
      try {
        const rawLogs = localStorage.getItem('today_daily_completion_logs_v1');
        if (rawLogs) logs = JSON.parse(rawLogs);
      } catch {}

      const backupObject = {
        appName: 'TEN Tasks Mobile',
        appVersion: 'v1.4.0',
        exportedAt: new Date().toISOString(),
        summary: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.isCompleted).length,
          todayTasks: tasks.filter((t) => t.isToday).length,
        },
        tasks,
        userGoal,
        completionLogs: logs,
        data: {
          tasks,
          userGoal,
          completionLogs: logs,
        },
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupObject, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `ten_tasks_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Cadangan data berhasil diunduh ke berkas .json');
    } catch (e: any) {
      console.error('Gagal mengekspor data cadangan:', e);
      showToast('Gagal mengunduh berkas cadangan');
    }
  }, [tasks, userGoal, showToast]);

  // Fitur Pemulihan Data Manual (Impor dari File JSON)
  const importBackupData = useCallback(
    (parsedJson: any, mode: 'merge' | 'replace'): { success: boolean; count: number; error?: string } => {
      try {
        let importedTasks: Task[] = [];
        let importedGoal = '';
        let importedLogs: any[] = [];

        // Deteksi format payload secara fleksibel (mendukung data.tasks, tasks, atau array)
        if (parsedJson && parsedJson.data && Array.isArray(parsedJson.data.tasks)) {
          importedTasks = parsedJson.data.tasks;
          importedGoal = parsedJson.data.userGoal || '';
          importedLogs = Array.isArray(parsedJson.data.completionLogs) ? parsedJson.data.completionLogs : [];
        } else if (parsedJson && Array.isArray(parsedJson.tasks)) {
          importedTasks = parsedJson.tasks;
          importedGoal = parsedJson.userGoal || (parsedJson.data && parsedJson.data.userGoal) || '';
          importedLogs = Array.isArray(parsedJson.completionLogs)
            ? parsedJson.completionLogs
            : (parsedJson.data && Array.isArray(parsedJson.data.completionLogs))
            ? parsedJson.data.completionLogs
            : [];
        } else if (Array.isArray(parsedJson)) {
          importedTasks = parsedJson;
        } else {
          return { success: false, count: 0, error: 'Format berkas tidak dikenali sebagai cadangan TEN Tasks' };
        }

        if (importedTasks.length === 0 && !importedGoal) {
          return { success: false, count: 0, error: 'Tidak ada tugas atau sasaran yang ditemukan dalam berkas cadangan' };
        }

        let finalTasks: Task[] = [];
        if (mode === 'replace') {
          finalTasks = importedTasks;
          if (importedGoal) {
            setUserGoal(importedGoal);
            try {
              localStorage.setItem(STORAGE_GOAL_KEY, importedGoal);
            } catch {}
          }
          if (importedLogs.length > 0) {
            try {
              localStorage.setItem('today_daily_completion_logs_v1', JSON.stringify(importedLogs));
            } catch {}
          }
        } else {
          // Mode Merge: satukan tugas
          const existingIds = new Set(tasks.map((t) => t.id));
          const newTasks = importedTasks.filter((t) => !existingIds.has(t.id));
          finalTasks = [...tasks, ...newTasks];
          if (!userGoal && importedGoal) {
            setUserGoal(importedGoal);
            try {
              localStorage.setItem(STORAGE_GOAL_KEY, importedGoal);
            } catch {}
          }
          if (importedLogs.length > 0) {
            try {
              let existingLogs: any[] = [];
              const raw = localStorage.getItem('today_daily_completion_logs_v1');
              if (raw) existingLogs = JSON.parse(raw);
              const logIds = new Set(existingLogs.map((l: any) => l.id || l.taskId));
              const mergedLogs = [...existingLogs, ...importedLogs.filter((l: any) => !logIds.has(l.id || l.taskId))];
              localStorage.setItem('today_daily_completion_logs_v1', JSON.stringify(mergedLogs));
            } catch {}
          }
        }

        setTasks(finalTasks);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalTasks));
          window.dispatchEvent(new Event('storage'));
        } catch {}

        if (currentUser) {
          cloudSyncService.pushTasks(currentUser.email, finalTasks, importedGoal || userGoal);
        }

        showToast(
          mode === 'replace'
            ? `Berhasil memulihkan ${importedTasks.length} tugas dari berkas cadangan`
            : `Berhasil menggabungkan ${importedTasks.length} tugas ke daftar saat ini`
        );

        return { success: true, count: importedTasks.length };
      } catch (err: any) {
        console.error('Gagal mengimpor cadangan:', err);
        return { success: false, count: 0, error: err.message || 'Gagal memproses berkas cadangan' };
      }
    },
    [tasks, userGoal, currentUser, showToast]
  );

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

  // 6. Logout dengan Konfirmasi & Opsi Pembersihan Bersih (Zero-Footprint Mode)
  const logoutUser = useCallback(
    (clearLocalTasks = false) => {
      cloudSyncService.logout();
      setCurrentUser(null);
      setLastCloudSyncedAt(null);
      setSyncConflict(null);
      isReconciledRef.current = false;
      lastReconciledEmailRef.current = null;

      try {
        localStorage.removeItem('ten_my_id_last_sync_v01');
        localStorage.removeItem('ten_cloud_session');
        localStorage.removeItem('ten_current_user');
      } catch {}

      if (clearLocalTasks) {
        // Bersihkan seluruh state aplikasi
        setTasks([]);
        setUserGoal('');
        setRelationships([]);
        setAiAnalysis(null);
        setOriginalSchedules({});
        setAiProposals({});
        setActiveScheduleModes({});

        // Bersihkan seluruh kunci lokal terkait data aplikasi di browser
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              (key.startsWith('ten_') ||
                key.startsWith('task_') ||
                key.includes('schedule') ||
                key.includes('relationships') ||
                key.includes('goal') ||
                key.includes('analysis') ||
                key.includes('backup'))
            ) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
          sessionStorage.clear();
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.warn('Gagal membersihkan storage saat logout:', e);
        }

        showToast('Telah keluar dari akun. Seluruh catatan & riwayat perangkat telah dibersihkan bersih.');
      } else {
        showToast('Telah keluar dari akun. Catatan tugas tetap tersimpan di perangkat ini (mode offline).');
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

  // 8. Opsi Sinkronisasi Data Lokal ke Database Cloudflare KV (Merge / Push / Pull)
  const syncLocalTasksToKV = useCallback(
    async (mode: 'merge' | 'push_local' | 'pull_cloud' = 'merge'): Promise<{ success: boolean; count?: number; message?: string }> => {
      if (!currentUser?.email) {
        showToast('Silakan masuk via SSO TEN terlebih dahulu.');
        return { success: false, message: 'Belum terautentikasi' };
      }

      setIsSyncingCloud(true);
      try {
        const cloudRes = await cloudSyncService.pullTasks(currentUser.email);
        const cloudTasks = cloudRes.tasks || [];

        let finalTasks: Task[] = [];
        if (mode === 'pull_cloud') {
          finalTasks = cloudTasks;
          if (cloudRes.userGoal) setUserGoal(cloudRes.userGoal);
        } else if (mode === 'push_local') {
          finalTasks = tasks;
          await cloudSyncService.pushTasks(currentUser.email, tasks, userGoal);
        } else {
          // 'merge' mode: satukan tugas lokal unik dengan tugas dari cloud KV
          const cloudTaskIds = new Set(cloudTasks.map((t) => t.id));
          const uniqueLocal = tasks.filter((t) => !cloudTaskIds.has(t.id));
          finalTasks = [...cloudTasks, ...uniqueLocal];
          await cloudSyncService.pushTasks(currentUser.email, finalTasks, cloudRes.userGoal || userGoal);
        }

        setTasks(finalTasks);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalTasks));
          window.dispatchEvent(new Event('storage'));
        } catch {}

        const nowIso = new Date().toISOString();
        setLastCloudSyncedAt(nowIso);
        try {
          localStorage.setItem('ten_my_id_last_sync_v01', nowIso);
        } catch {}

        const msg =
          mode === 'pull_cloud'
            ? `Berhasil mengambil ${finalTasks.length} tugas dari Cloudflare KV.`
            : mode === 'push_local'
            ? `Berhasil mengunggah ${finalTasks.length} tugas lokal ke database KV.`
            : `Berhasil menyatukan ${finalTasks.length} tugas ke database Cloudflare KV.`;
        showToast(msg);
        return { success: true, count: finalTasks.length, message: msg };
      } catch (err: any) {
        const errMsg = err.message || 'Gagal menyinkronkan data ke Cloudflare KV';
        showToast(errMsg);
        return { success: false, message: errMsg };
      } finally {
        setIsSyncingCloud(false);
      }
    },
    [currentUser, tasks, userGoal, showToast]
  );

  // 9. Toggle Auto Sync
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
        refreshUserSession,
        syncConflict,
        isReconciling,
        resolveSyncConflict,
        dismissSyncConflict,
        storageMode,
        setStorageMode,
        isAutoOfflineFallbackEnabled,
        toggleAutoOfflineFallback,
        isOnline,
        activeDevices,
        refreshActiveDevices,
        revokeDeviceSession,
        loginUser,
        registerUser,
        logoutUser,
        triggerCloudSync,
        syncLocalTasksToKV,
        toggleAutoSync,
        verifyRecoveryPin,
        resetPasswordUser,
        updateUserProfile,
        exportBackupData,
        importBackupData,
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
        relationships,
        addRelationship,
        updateRelationship,
        deleteRelationship,
        getActiveTaskForRelationship,
        addTaskForRelationship,
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
