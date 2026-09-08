type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

interface Env {
  Task_KV: KVNamespace;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      action: 'register' | 'login';
      email: string;
      password?: string;
      name?: string;
      initialTasks?: any[];
      userGoal?: string;
    };

    const { action, email, password, name, initialTasks, userGoal } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userKey = `user:${normalizedEmail}`;

    if (!env.Task_KV) {
      return new Response(JSON.stringify({ error: 'Task_KV binding tidak tersedia' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'register') {
      const existingUser = await env.Task_KV.get(userKey);
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Akun dengan email ini sudah terdaftar' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash: password, // Note: Dalam produksi skala penuh gunakan salt/bcrypt/WebCrypto
        createdAt: new Date().toISOString(),
      };

      await env.Task_KV.put(userKey, JSON.stringify(userData));

      // Jika ada initial tasks yang diunggah saat registrasi
      if (initialTasks && Array.isArray(initialTasks)) {
        const tasksKey = `tasks:${normalizedEmail}`;
        const syncPayload = {
          tasks: initialTasks,
          userGoal: userGoal || '',
          updatedAt: new Date().toISOString(),
        };
        await env.Task_KV.put(tasksKey, JSON.stringify(syncPayload));
      }

      return new Response(JSON.stringify({
        success: true,
        user: { name: userData.name, email: userData.email },
        message: 'Registrasi berhasil dan tersimpan di Task_KV',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (action === 'login') {
      const existingUserRaw = await env.Task_KV.get(userKey);
      if (!existingUserRaw) {
        return new Response(JSON.stringify({ error: 'Email atau password salah' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const userData = JSON.parse(existingUserRaw);
      if (userData.passwordHash !== password) {
        return new Response(JSON.stringify({ error: 'Email atau password salah' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Ambil data tugas tersimpan di cloud jika ada
      const tasksKey = `tasks:${normalizedEmail}`;
      const cloudTasksRaw = await env.Task_KV.get(tasksKey);
      let cloudData = null;
      if (cloudTasksRaw) {
        try {
          cloudData = JSON.parse(cloudTasksRaw);
        } catch (e) {
          // ignore parsing error
        }
      }

      return new Response(JSON.stringify({
        success: true,
        user: { name: userData.name, email: userData.email },
        cloudData,
        message: 'Login berhasil',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Action tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
