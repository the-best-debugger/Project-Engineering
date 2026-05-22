import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const handleSessionExpired = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:session-expired'));
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default client;
