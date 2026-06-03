import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly refresh cookie
});

// ── Access token kept in memory (not localStorage → safer against XSS) ──────
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ── Silent refresh on 401, with a single in-flight refresh shared by callers ─
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          api.post('/auth/refresh').finally(() => {
            refreshing = null;
          });
        const { data } = await refreshing;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        setAccessToken(null);
        // Let the AuthContext react to a hard logout.
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

/** Normalise an axios error into a human-readable message. */
export function errMsg(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.details?.[0]?.message ||
    error?.message ||
    fallback
  );
}

export default api;
