import { Task } from "@/types/task";

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface SyncResponse {
  success: boolean;
  updatedAt?: string;
  message?: string;
  tasks?: Task[];
  userGoal?: string;
  error?: string;
}

const USER_STORAGE_KEY = 'ten_my_id_user_v01';
const MOCK_KV_STORAGE_KEY = 'ten_mock_cloudflare_kv';

// Helper for local mock KV when Pages Functions are not running (e.g. standard next dev)
function getMockKV(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MOCK_KV_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMockKV(data: Record<string, any>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOCK_KV_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Mock KV save error', e);
  }
}

export const cloudSyncService = {
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserProfile | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  },

  async register(
    name: string,
    email: string,
    password: string,
    initialTasks?: Task[],
    userGoal?: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // 1. Coba hubungi Cloudflare Pages Function API
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name,
          email: normalizedEmail,
          password,
          initialTasks,
          userGoal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserProfile = { name: data.user.name, email: data.user.email };
        this.setCurrentUser(user);
        return { success: true, user };
      } else if (res.status === 404 || res.status === 502) {
        // Fallback ke local mock KV jika API pages function belum aktif di local next dev
        throw new Error('FALLBACK_MOCK');
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Gagal mendaftar' };
      }
    } catch (e: any) {
      // Fallback local mock Cloudflare KV
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      if (kv[userKey]) {
        return { success: false, error: 'Akun dengan email ini sudah terdaftar di Task_KV (Simulasi)' };
      }

      const user: UserProfile = {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
      };

      kv[userKey] = { ...user, passwordHash: password };
      if (initialTasks && Array.isArray(initialTasks)) {
        kv[`tasks:${normalizedEmail}`] = {
          tasks: initialTasks,
          userGoal: userGoal || '',
          updatedAt: new Date().toISOString(),
        };
      }
      saveMockKV(kv);

      this.setCurrentUser(user);
      return { success: true, user };
    }
  },

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; cloudData?: { tasks: Task[]; userGoal?: string }; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: normalizedEmail,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserProfile = { name: data.user.name, email: data.user.email };
        this.setCurrentUser(user);
        return { success: true, user, cloudData: data.cloudData };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Email atau password salah' };
      }
    } catch (e) {
      // Fallback local mock Cloudflare KV
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      const savedUser = kv[userKey];

      if (!savedUser || savedUser.passwordHash !== password) {
        return { success: false, error: 'Email atau kata sandi tidak cocok' };
      }

      const user: UserProfile = { name: savedUser.name, email: savedUser.email };
      this.setCurrentUser(user);

      const tasksKey = `tasks:${normalizedEmail}`;
      const cloudData = kv[tasksKey] || null;

      return { success: true, user, cloudData };
    }
  },

  async pushTasks(email: string, tasks: Task[], userGoal?: string): Promise<SyncResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          tasks,
          userGoal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, updatedAt: data.updatedAt, message: 'Berhasil disinkronkan ke Task_KV' };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Gagal menyimpan ke cloud' };
      }
    } catch {
      // Mock KV fallback
      const kv = getMockKV();
      const updatedAt = new Date().toISOString();
      kv[`tasks:${normalizedEmail}`] = {
        tasks,
        userGoal: userGoal || '',
        updatedAt,
      };
      saveMockKV(kv);
      return { success: true, updatedAt, message: 'Berhasil disinkronkan ke Task_KV (Lokal Terhubung)' };
    }
  },

  async pullTasks(email: string): Promise<SyncResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`/api/sync?email=${encodeURIComponent(normalizedEmail)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          tasks: data.tasks || [],
          userGoal: data.userGoal || '',
          updatedAt: data.updatedAt,
        };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Gagal mengambil data dari cloud' };
      }
    } catch {
      // Mock KV fallback
      const kv = getMockKV();
      const data = kv[`tasks:${normalizedEmail}`];
      if (data) {
        return {
          success: true,
          tasks: data.tasks || [],
          userGoal: data.userGoal || '',
          updatedAt: data.updatedAt,
        };
      }
      return {
        success: true,
        tasks: [],
        userGoal: '',
        updatedAt: undefined,
      };
    }
  },

  logout() {
    this.setCurrentUser(null);
  },
};
