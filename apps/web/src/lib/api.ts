import ky, { HTTPError, type KyInstance } from 'ky';

import { useAuthStore } from './authStore';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  refreshing = (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as RefreshResponse;
      useAuthStore.setState({
        accessToken: json.accessToken,
        refreshToken: json.refreshToken,
      });
      return json.accessToken;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const api: KyInstance = ky.create({
  prefixUrl: '/api/v1',
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) request.headers.set('authorization', `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401) return response;
        const newToken = await refreshAccessToken();
        if (!newToken) {
          useAuthStore.getState().logout();
          return response;
        }
        const retry = new Request(request);
        retry.headers.set('authorization', `Bearer ${newToken}`);
        return fetch(retry);
      },
    ],
  },
});

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await api.post(path, { json: body }).json<T>();
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function putJson<T>(path: string, body: unknown): Promise<T> {
  try {
    return await api.put(path, { json: body }).json<T>();
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function getJson<T>(path: string, search?: Record<string, string | undefined>): Promise<T> {
  try {
    const url = search ? `${path}?${new URLSearchParams(filterDefined(search))}` : path;
    return await api.get(url).json<T>();
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function del(path: string): Promise<void> {
  try {
    await api.delete(path);
  } catch (e) {
    throw normalizeError(e);
  }
}

function filterDefined(s: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(s)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

async function normalizeError(e: unknown): Promise<Error> {
  if (e instanceof HTTPError) {
    try {
      const body = (await e.response.json()) as {
        error?: { code: string; message: string };
      };
      const err = new Error(body.error?.message ?? e.message);
      (err as Error & { code?: string }).code = body.error?.code;
      return err;
    } catch {
      return new Error(e.message);
    }
  }
  return e instanceof Error ? e : new Error(String(e));
}
