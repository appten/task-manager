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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.Task_KV) {
      return new Response(JSON.stringify({ error: 'Task_KV binding tidak tersedia' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tasksKey = `tasks:${cleanEmail}`;
    const devicesKey = `devices:${cleanEmail}`;

    const [rawData, rawDevices] = await Promise.all([
      env.Task_KV.get(tasksKey),
      env.Task_KV.get(devicesKey),
    ]);

    let devices: any[] = [];
    if (rawDevices) {
      try {
        devices = JSON.parse(rawDevices);
      } catch {}
    }

    if (!rawData) {
      return new Response(
        JSON.stringify({
          tasks: [],
          userGoal: '',
          updatedAt: null,
          devices,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const parsed = JSON.parse(rawData);
    return new Response(
      JSON.stringify({
        ...parsed,
        devices,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json()) as {
      email: string;
      tasks: any[];
      userGoal?: string;
      deviceInfo?: any;
    };

    const { email, tasks, userGoal, deviceInfo } = body;

    if (!email || !Array.isArray(tasks)) {
      return new Response(JSON.stringify({ error: 'Email dan tasks array diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.Task_KV) {
      return new Response(JSON.stringify({ error: 'Task_KV binding tidak tersedia' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tasksKey = `tasks:${cleanEmail}`;
    const devicesKey = `devices:${cleanEmail}`;
    const nowIso = new Date().toISOString();

    const payload = {
      tasks,
      userGoal: userGoal || '',
      updatedAt: nowIso,
    };

    // Update list devices jika ada deviceInfo yang disertakan
    let updatedDevices: any[] = [];
    try {
      const rawDevices = await env.Task_KV.get(devicesKey);
      let devicesList: any[] = rawDevices ? JSON.parse(rawDevices) : [];

      if (deviceInfo && deviceInfo.id) {
        const currentDev = {
          ...deviceInfo,
          lastActiveAt: nowIso,
        };
        // Perbarui device jika sudah ada, atau tambahkan jika baru
        const existingIdx = devicesList.findIndex((d) => d.id === deviceInfo.id);
        if (existingIdx >= 0) {
          devicesList[existingIdx] = { ...devicesList[existingIdx], ...currentDev };
        } else {
          devicesList.unshift(currentDev);
        }

        // Batasi maksimal 10 perangkat terakhir aktif
        devicesList = devicesList.slice(0, 10);
        await env.Task_KV.put(devicesKey, JSON.stringify(devicesList));
        updatedDevices = devicesList;
      } else {
        updatedDevices = devicesList;
      }
    } catch {}

    await env.Task_KV.put(tasksKey, JSON.stringify(payload));

    return new Response(
      JSON.stringify({
        success: true,
        updatedAt: payload.updatedAt,
        count: tasks.length,
        devices: updatedDevices,
        message: 'Data berhasil disinkronkan ke Task_KV Cloudflare',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Cabut / Hapus Sesi Perangkat Tertentu
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const deviceId = url.searchParams.get('deviceId');

    if (!email || !deviceId) {
      return new Response(JSON.stringify({ error: 'Email dan deviceId diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.Task_KV) {
      return new Response(JSON.stringify({ error: 'Task_KV binding tidak tersedia' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const devicesKey = `devices:${cleanEmail}`;
    const rawDevices = await env.Task_KV.get(devicesKey);

    let devicesList: any[] = rawDevices ? JSON.parse(rawDevices) : [];
    devicesList = devicesList.filter((d) => d.id !== deviceId);

    await env.Task_KV.put(devicesKey, JSON.stringify(devicesList));

    return new Response(
      JSON.stringify({
        success: true,
        devices: devicesList,
        message: 'Sesi perangkat berhasil dicabut',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
