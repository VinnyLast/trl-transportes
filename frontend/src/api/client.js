import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trl_token');
      localStorage.removeItem('trl_usuario');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Monta uma mensagem de erro legivel a partir da resposta da API, incluindo o
// motivo especifico de cada campo quando o backend retorna erro de validacao (zod)
export function mensagemErroApi(err, fallback) {
  const dados = err.response?.data;
  if (!dados) return fallback;

  const camposComErro = dados.detalhes?.fieldErrors;
  if (camposComErro) {
    const mensagens = Object.entries(camposComErro)
      .filter(([, msgs]) => msgs?.length)
      .map(([campo, msgs]) => `${campo}: ${msgs[0]}`);
    if (mensagens.length) return `${dados.erro || fallback} (${mensagens.join('; ')})`;
  }

  return dados.erro || fallback;
}

export default api;
