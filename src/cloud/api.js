// Tiny fetch wrapper for the profile API.

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || body?.reason || `HTTP ${status}`);
    this.status = status;
    this.body = body || {};
    this.network = status === 0;
  }
}

export function createApi(cfg, auth) {
  const base = cfg.apiUrl.replace(/\/+$/, '');
  async function request(method, path, body, { keepalive = false } = {}) {
    const token = await auth.getToken();
    if (!token) throw new ApiError(401, { error: 'not signed in' });
    let res;
    try {
      res = await fetch(base + path, {
        method,
        keepalive,
        headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, { error: 'network' });
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json);
    return json;
  }
  return {
    get: (p) => request('GET', p),
    put: (p, b, o) => request('PUT', p, b, o),
    post: (p, b, o) => request('POST', p, b, o),
    del: (p) => request('DELETE', p),
  };
}
