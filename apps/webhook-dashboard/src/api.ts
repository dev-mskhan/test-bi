import axios from 'axios';

const api = axios.create({ baseURL: '/', withCredentials: true });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('wh_access');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err);

    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (t) => {
            orig.headers.Authorization = `Bearer ${t}`;
            resolve(api(orig));
          },
          reject,
        });
      });
    }

    orig._retry = true;
    refreshing = true;
    try {
      const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
      localStorage.setItem('wh_access', data.accessToken);
      window.dispatchEvent(new Event('wh_auth_changed'));
      queue.forEach((p) => p.resolve(data.accessToken));
      queue = [];
      refreshing = false;
      orig.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch (refreshErr) {
      queue.forEach((p) => p.reject(refreshErr));
      queue = [];
      refreshing = false;
      localStorage.removeItem('wh_access');
      window.dispatchEvent(new Event('wh_auth_changed'));
      window.location.href = '/login';
      return Promise.reject(err);
    }
  }
);

export const whApi = {
  // Auth
  register: (d: { name: string; email: string; password: string; webhookName: string }) => api.post('/auth/register', d),
  login:    (d: { email: string; password: string }) => api.post('/auth/login', d),
  logout:   () => api.post('/auth/logout'),
  me:       () => api.get('/auth/me'),

  // Stats
  stats: () => api.get('/api/stats'),

  // Logs
  logs: (params?: Record<string, unknown>) => api.get('/api/logs', { params }),
  log:  (id: string) => api.get(`/api/logs/${id}`),

  // Deliveries
  deliveries: (params?: Record<string, unknown>) => api.get('/api/deliveries', { params }),
};

export default api;