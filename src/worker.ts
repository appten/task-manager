import { onRequestPost as handleAuthPost } from '../functions/api/auth';
import {
  onRequestGet as handleSyncGet,
  onRequestPost as handleSyncPost,
  onRequestDelete as handleSyncDelete,
} from '../functions/api/sync';

export interface Env {
  Task_KV: any;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  DEV_ADMIN_EMAIL?: string;
  DEV_ADMIN_NAME?: string;
  DEV_ADMIN_PASSWORD?: string;
  TEN_CLIENT_ID?: string;
  TEN_CLIENT_SECRET?: string;
  TEN_ISSUER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Tangani endpoint Auth (/api/auth)
    if (url.pathname === '/api/auth' || url.pathname.startsWith('/api/auth/')) {
      if (request.method === 'POST') {
        return handleAuthPost({
          request,
          env,
          params: {},
          waitUntil: (promise: Promise<any>) => ctx?.waitUntil ? ctx.waitUntil(promise) : promise,
          next: () => Promise.resolve(new Response(null, { status: 404 })),
          data: {},
        });
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tangani endpoint Sync (/api/sync)
    if (url.pathname === '/api/sync' || url.pathname.startsWith('/api/sync/')) {
      if (request.method === 'GET') {
        return handleSyncGet({
          request,
          env,
          params: {},
          waitUntil: (promise: Promise<any>) => ctx?.waitUntil ? ctx.waitUntil(promise) : promise,
          next: () => Promise.resolve(new Response(null, { status: 404 })),
          data: {},
        });
      }
      if (request.method === 'POST') {
        return handleSyncPost({
          request,
          env,
          params: {},
          waitUntil: (promise: Promise<any>) => ctx?.waitUntil ? ctx.waitUntil(promise) : promise,
          next: () => Promise.resolve(new Response(null, { status: 404 })),
          data: {},
        });
      }
      if (request.method === 'DELETE') {
        return handleSyncDelete({
          request,
          env,
          params: {},
          waitUntil: (promise: Promise<any>) => ctx?.waitUntil ? ctx.waitUntil(promise) : promise,
          next: () => Promise.resolve(new Response(null, { status: 404 })),
          data: {},
        });
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sajikan Static Assets (Next.js output: export pada folder ./out)
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Halaman tidak ditemukan', { status: 404 });
  },
};
