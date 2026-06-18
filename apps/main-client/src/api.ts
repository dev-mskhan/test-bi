import axios from 'axios';

const api = axios.create({
  baseURL:     '/auth',
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) return Promise.reject(err);

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing      = true;

    try {
      const { data } = await axios.post('/auth/refresh', {}, { withCredentials: true });
      const newToken = data.accessToken;
      localStorage.setItem('accessToken', newToken);
      queue.forEach((cb) => cb(newToken));
      queue      = [];
      refreshing = false;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      refreshing = false;
      queue      = [];
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(err);
    }
  }
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/login', data),

  logout: () => api.post('/logout'),

  me: () => api.get('/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/password', data),

  deleteAccount: () => api.delete('/account'),
};

export default api;