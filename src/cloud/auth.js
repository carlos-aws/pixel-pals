// Google sign-in through Amazon Cognito's hosted endpoints using the OAuth 2.0
// authorization-code flow with PKCE. No libraries needed.

const KEY = 'pixelpals.auth';
const PKCE_KEY = 'pixelpals.pkce';

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomString(len = 64) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return b64url(a).slice(0, len);
}
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(atob(payload).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  } catch { return null; }
}

/** The app's own URL as registered with Cognito (origin + path, no query). */
export function appRedirectUri() {
  const path = location.pathname.replace(/index\.html$/, '');
  return location.origin + (path.endsWith('/') ? path : path + '/');
}

export function createCognitoAuth(cfg) {
  const base = `https://${cfg.cognitoDomain}`;
  const redirectUri = appRedirectUri();
  let tokens = null;
  try { tokens = JSON.parse(localStorage.getItem(KEY)); } catch { tokens = null; }
  const persist = (t) => { tokens = t; try { if (t) localStorage.setItem(KEY, JSON.stringify(t)); else localStorage.removeItem(KEY); } catch { /* ignore */ } };

  async function tokenRequest(params) {
    const res = await fetch(`${base}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, ...params }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `token request failed (${res.status})`);
    return json;
  }

  return {
    kind: 'cognito',
    isSignedIn: () => !!tokens?.refresh_token,

    user() {
      const claims = tokens?.id_token ? decodeJwt(tokens.id_token) : null;
      return claims ? { email: claims.email, name: claims.name, sub: claims.sub } : null;
    },

    /** Redirect to Google (via Cognito). */
    async signIn() {
      const verifier = randomString(64);
      const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const state = randomString(24);
      sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
      const q = new URLSearchParams({
        client_id: cfg.clientId, response_type: 'code', scope: 'openid email profile',
        redirect_uri: redirectUri, state, code_challenge: challenge, code_challenge_method: 'S256', identity_provider: 'Google',
      });
      location.assign(`${base}/oauth2/authorize?${q}`);
    },

    /** Finish the redirect back from Google. Returns { error } for a failed sign-in. */
    async handleCallback() {
      const p = new URLSearchParams(location.search);
      if (!p.has('code') && !p.has('error')) return { handled: false };
      const clean = () => history.replaceState(null, '', redirectUri + (p.get('keep') || ''));
      if (p.has('error')) { clean(); return { handled: true, error: p.get('error_description') || p.get('error') }; }
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(PKCE_KEY)); } catch { saved = null; }
      sessionStorage.removeItem(PKCE_KEY);
      if (!saved || saved.state !== p.get('state')) { clean(); return { handled: true, error: 'Sign-in session expired. Please try again.' }; }
      try {
        const t = await tokenRequest({ grant_type: 'authorization_code', code: p.get('code'), redirect_uri: redirectUri, code_verifier: saved.verifier });
        persist({ id_token: t.id_token, access_token: t.access_token, refresh_token: t.refresh_token, expiresAt: Date.now() + (t.expires_in || 3600) * 1000 });
        clean();
        return { handled: true };
      } catch (e) {
        clean();
        return { handled: true, error: e.message };
      }
    },

    /** A fresh ID token, refreshing it when it is about to expire. */
    async getToken() {
      if (!tokens?.refresh_token) return null;
      if (Date.now() > (tokens.expiresAt || 0) - 60_000) {
        try {
          const t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
          persist({ ...tokens, id_token: t.id_token, access_token: t.access_token, expiresAt: Date.now() + (t.expires_in || 3600) * 1000 });
        } catch (e) {
          if (!/network|fetch/i.test(String(e.message))) persist(null); // refresh token rejected: sign in again
          return null;
        }
      }
      return tokens?.id_token || null;
    },

    signOut() {
      persist(null);
      const q = new URLSearchParams({ client_id: cfg.clientId, logout_uri: redirectUri });
      location.assign(`${base}/logout?${q}`);
    },
  };
}

/** Fake auth for the local mock server (tools/mock-cloud.mjs). */
export function createMockAuth(cfg) {
  const KEYM = 'pixelpals.mockauth';
  let on = localStorage.getItem(KEYM) === '1';
  return {
    kind: 'mock',
    isSignedIn: () => on,
    user: () => (on ? { email: cfg.mockUser || 'parent@example.com', name: 'Mock Parent', sub: 'mock-user' } : null),
    async signIn() { on = true; localStorage.setItem(KEYM, '1'); location.reload(); },
    async handleCallback() { return { handled: false }; },
    async getToken() { return on ? 'mock-token' : null; },
    signOut() { on = false; localStorage.removeItem(KEYM); location.reload(); },
  };
}
