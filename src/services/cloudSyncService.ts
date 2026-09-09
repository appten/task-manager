import { Task } from "@/types/task";
import { feedbackService } from "./feedbackService";

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  role?: UserRole;
  avatar?: string;
  createdAt?: string;
  recoveryPinSet?: boolean;
  taskCount?: number;
}

export interface AppStatistics {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  totalFeedbacks: number;
  categoryDistribution: Record<string, number>;
  totalFocusHours: number;
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
    const kv = raw ? JSON.parse(raw) : {};

    // Inisialisasi default index dan akun pengelola demo dari Environment Variable
    if (!kv['system:users_index'] || !Array.isArray(kv['system:users_index']) || kv['system:users_index'].length === 0) {
      const defaultAdminEmail = (
        (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || process.env.DEV_ADMIN_EMAIL)) ||
        'admin@ten.my.id'
      ).trim().toLowerCase();

      kv['system:users_index'] = [defaultAdminEmail];
      kv[`user:${defaultAdminEmail}`] = {
        name: 'Pengelola Sistem',
        email: defaultAdminEmail,
        passwordHash: 'admin123',
        role: 'admin',
        recoveryPin: '999999',
        createdAt: '2026-08-25T00:00:00.000Z',
      };
      saveMockKV(kv);
    }

    return kv;
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

  // 1. Registrasi Akun Baru
  async register(
    name: string,
    email: string,
    password: string,
    initialTasks?: Task[],
    userGoal?: string,
    recoveryPin?: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name,
          email: normalizedEmail,
          password,
          recoveryPin,
          initialTasks,
          userGoal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserProfile = {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          createdAt: data.user.createdAt,
          recoveryPinSet: Boolean(data.user.recoveryPinSet),
        };
        this.setCurrentUser(user);
        return { success: true, user };
      } else if (res.status === 404 || res.status === 502) {
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

      const isInitialAdmin = normalizedEmail.startsWith('admin') || normalizedEmail.startsWith('dev');
      const userRole: UserRole = isInitialAdmin ? 'admin' : 'user';

      const user: UserProfile = {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: userRole,
        createdAt: new Date().toISOString(),
        recoveryPinSet: Boolean(recoveryPin),
      };

      kv[userKey] = {
        ...user,
        passwordHash: password,
        recoveryPin: recoveryPin || '',
      };

      const indexList: string[] = Array.isArray(kv['system:users_index']) ? kv['system:users_index'] : [];
      if (!indexList.includes(normalizedEmail)) {
        indexList.push(normalizedEmail);
        kv['system:users_index'] = indexList;
      }

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

  // 2. Masuk / Login Akun
  async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: UserProfile;
    cloudData?: { tasks: Task[]; userGoal?: string };
    error?: string;
  }> {
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
        const user: UserProfile = {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          createdAt: data.user.createdAt,
          recoveryPinSet: Boolean(data.user.recoveryPinSet),
        };
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
        return { success: false, error: 'Email atau kata sandi tidak sesuai' };
      }

      const role: UserRole = savedUser.role || (normalizedEmail.startsWith('admin') || normalizedEmail.startsWith('dev') ? 'admin' : 'user');

      const user: UserProfile = {
        name: savedUser.name,
        email: savedUser.email,
        role,
        createdAt: savedUser.createdAt,
        recoveryPinSet: Boolean(savedUser.recoveryPin),
      };
      this.setCurrentUser(user);

      const tasksKey = `tasks:${normalizedEmail}`;
      const cloudData = kv[tasksKey] || null;

      return { success: true, user, cloudData };
    }
  },

  // 3. Verifikasi PIN Pemulihan
  async verifyRecoveryPin(
    email: string,
    recoveryPin: string
  ): Promise<{ success: boolean; name?: string; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-recovery',
          email: normalizedEmail,
          recoveryPin,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, name: data.name };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'PIN Pemulihan tidak valid' };
      }
    } catch (e) {
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      const savedUser = kv[userKey];

      if (!savedUser) {
        return { success: false, error: 'Akun dengan email ini tidak ditemukan' };
      }

      if (!savedUser.recoveryPin) {
        return {
          success: false,
          error: 'Akun ini belum memiliki PIN pemulihan tersimpan.',
        };
      }

      if (savedUser.recoveryPin !== recoveryPin) {
        return { success: false, error: 'PIN Pemulihan salah. Silakan periksa kembali.' };
      }

      return { success: true, name: savedUser.name };
    }
  },

  // 4. Reset Kata Sandi Baru dengan PIN
  async resetPassword(
    email: string,
    recoveryPin: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: normalizedEmail,
          recoveryPin,
          newPassword,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Gagal mereset kata sandi' };
      }
    } catch (e) {
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      const savedUser = kv[userKey];

      if (!savedUser) {
        return { success: false, error: 'Akun tidak ditemukan' };
      }

      if (savedUser.recoveryPin && savedUser.recoveryPin !== recoveryPin) {
        return { success: false, error: 'PIN Pemulihan salah' };
      }

      savedUser.passwordHash = newPassword;
      savedUser.passwordResetAt = new Date().toISOString();
      kv[userKey] = savedUser;
      saveMockKV(kv);

      return {
        success: true,
        message: 'Kata sandi berhasil diperbarui (Simulasi Lokal)',
      };
    }
  },

  // 5. Perbarui Profil / Ubah Kata Sandi
  async updateProfile(
    email: string,
    name?: string,
    oldPassword?: string,
    newPassword?: string,
    recoveryPin?: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-profile',
          email: normalizedEmail,
          name,
          oldPassword,
          newPassword,
          recoveryPin,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user: UserProfile = {
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'user',
          createdAt: data.user.createdAt,
          recoveryPinSet: Boolean(data.user.recoveryPinSet),
        };
        this.setCurrentUser(user);
        return { success: true, user };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Gagal memperbarui profil' };
      }
    } catch (e) {
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      const savedUser = kv[userKey];

      if (!savedUser) {
        return { success: false, error: 'Akun tidak ditemukan' };
      }

      if (newPassword) {
        if (!oldPassword || savedUser.passwordHash !== oldPassword) {
          return { success: false, error: 'Kata sandi saat ini tidak cocok' };
        }
        savedUser.passwordHash = newPassword;
      }

      if (name && name.trim()) {
        savedUser.name = name.trim();
      }

      if (recoveryPin && recoveryPin.trim()) {
        savedUser.recoveryPin = recoveryPin.trim();
      }

      savedUser.updatedAt = new Date().toISOString();
      kv[userKey] = savedUser;
      saveMockKV(kv);

      const updatedUser: UserProfile = {
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role || 'user',
        createdAt: savedUser.createdAt,
        recoveryPinSet: Boolean(savedUser.recoveryPin),
      };
      this.setCurrentUser(updatedUser);

      return { success: true, user: updatedUser };
    }
  },

  // 6. Mengambil Seluruh Akun (Halaman Pengelola)
  async getAllUsers(): Promise<UserProfile[]> {
    const current = this.getCurrentUser();
    if (!current || current.role !== 'admin') {
      return [];
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-users', requesterEmail: current.email }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.users || [];
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      }
      return [];
    } catch {
      // Mock KV fallback
      const kv = getMockKV();
      const indexList: string[] = Array.isArray(kv['system:users_index']) ? kv['system:users_index'] : [];
      const result: UserProfile[] = [];

      for (const email of indexList) {
        const u = kv[`user:${email}`];
        if (u) {
          const rawTasks = kv[`tasks:${email}`];
          const taskCount = Array.isArray(rawTasks?.tasks) ? rawTasks.tasks.length : 0;
          result.push({
            name: u.name,
            email: u.email,
            role: u.role || (u.email?.startsWith('admin') || u.email?.startsWith('dev') ? 'admin' : 'user'),
            createdAt: u.createdAt,
            recoveryPinSet: Boolean(u.recoveryPin),
            taskCount,
          });
        }
      }

      return result;
    }
  },

  // 7. Mengubah Role Akun (Halaman Pengelola)
  async updateUserRole(
    email: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    const current = this.getCurrentUser();
    if (!current || current.role !== 'admin') {
      return { success: false, error: 'Akses ditolak: Hanya pengelola yang dapat mengubah role' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-role',
          email: normalizedEmail,
          targetRole: newRole,
          requesterEmail: current.email,
        }),
      });

      if (res.ok) {
        // Jika akun yang diubah adalah currentUser saat ini, update juga sesi lokalnya
        const current = this.getCurrentUser();
        if (current && current.email.toLowerCase() === normalizedEmail) {
          this.setCurrentUser({ ...current, role: newRole });
        }
        return { success: true };
      } else if (res.status === 404 || res.status === 502) {
        throw new Error('FALLBACK_MOCK');
      } else {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Gagal mengubah role akun' };
      }
    } catch {
      // Mock KV fallback
      const kv = getMockKV();
      const userKey = `user:${normalizedEmail}`;
      const savedUser = kv[userKey];
      if (!savedUser) {
        return { success: false, error: 'Akun tidak ditemukan di sistem' };
      }

      savedUser.role = newRole;
      kv[userKey] = savedUser;
      saveMockKV(kv);

      const current = this.getCurrentUser();
      if (current && current.email.toLowerCase() === normalizedEmail) {
        this.setCurrentUser({ ...current, role: newRole });
      }

      return { success: true };
    }
  },

  // 8. Menghitung Statistik Aplikasi (Halaman Pengelola)
  async getAppStatistics(localTasks: Task[] = []): Promise<AppStatistics> {
    const users = await this.getAllUsers();
    const feedbacks = feedbackService.getFeedbacks();

    let totalTasksCount = 0;
    let completedCount = 0;
    const categoryDistribution: Record<string, number> = {
      Pekerjaan: 0,
      Pribadi: 0,
      Belajar: 0,
      Kesehatan: 0,
      Istirahat: 0,
      Lainnya: 0,
    };
    let totalFocusSeconds = 0;

    // Kumpulkan statistik dari localTasks pengguna saat ini dan cloud tasks
    const kv = getMockKV();
    const countedTaskIds = new Set<string>();

    const processTasks = (tList: Task[]) => {
      tList.forEach((t) => {
        if (!countedTaskIds.has(t.id)) {
          countedTaskIds.add(t.id);
          totalTasksCount++;
          if (t.isCompleted) completedCount++;
          if (t.category && categoryDistribution[t.category] !== undefined) {
            categoryDistribution[t.category]++;
          } else {
            categoryDistribution['Lainnya'] = (categoryDistribution['Lainnya'] || 0) + 1;
          }
          if (t.timeSpentSeconds) {
            totalFocusSeconds += t.timeSpentSeconds;
          }
        }
      });
    };

    processTasks(localTasks);

    // Iterasi tasks dari setiap user yang tersimpan di cloud jika ada
    users.forEach((u) => {
      const savedTasks = kv[`tasks:${u.email.toLowerCase()}`];
      if (savedTasks && Array.isArray(savedTasks.tasks)) {
        processTasks(savedTasks.tasks);
      }
    });

    const admins = users.filter((u) => u.role === 'admin').length;
    const regularUsers = users.filter((u) => u.role !== 'admin').length;

    return {
      totalUsers: users.length,
      totalAdmins: admins,
      totalRegularUsers: regularUsers,
      totalTasks: totalTasksCount,
      completedTasks: completedCount,
      activeTasks: totalTasksCount - completedCount,
      totalFeedbacks: feedbacks.length,
      categoryDistribution,
      totalFocusHours: Math.round((totalFocusSeconds / 3600) * 10) / 10,
    };
  },

  // 9. Unggah Tugas ke Cloud
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

  // 10. Ambil Tugas dari Cloud
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

  // 11. Logout
  logout() {
    this.setCurrentUser(null);
  },
};
