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

    const tasksKey = `tasks:${email.trim().toLowerCase()}`;
    const rawData = await env.Task_KV.get(tasksKey);

    if (!rawData) {
      return new Response(JSON.stringify({
        tasks: [],
        userGoal: '',
        updatedAt: null,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = JSON.parse(rawData);
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
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
    const body = await request.json() as {
      email: string;
      tasks: any[];
      userGoal?: string;
    };

    const { email, tasks, userGoal } = body;

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

    const tasksKey = `tasks:${email.trim().toLowerCase()}`;
    const payload = {
      tasks,
      userGoal: userGoal || '',
      updatedAt: new Date().toISOString(),
    };

    await env.Task_KV.put(tasksKey, JSON.stringify(payload));

    return new Response(JSON.stringify({
      success: true,
      updatedAt: payload.updatedAt,
      count: tasks.length,
      message: 'Data berhasil disinkronkan ke Task_KV Cloudflare',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
