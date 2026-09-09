import axios from 'axios';

const motoristaApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

motoristaApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('trl_motorista_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function limparSessaoMotorista() {
  localStorage.removeItem('trl_motorista_token');
  localStorage.removeItem('trl_motorista_nome');
}

export default motoristaApi;
