import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('trl_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('trl_token');
    if (!token) {
      setCarregando(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUsuario(res.data);
        localStorage.setItem('trl_usuario', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('trl_token');
        localStorage.removeItem('trl_usuario');
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(credenciais) {
    const res = await api.post('/auth/login', credenciais);
    localStorage.setItem('trl_token', res.data.token);
    localStorage.setItem('trl_usuario', JSON.stringify(res.data.usuario));
    setUsuario(res.data.usuario);
  }

  function sair() {
    localStorage.removeItem('trl_token');
    localStorage.removeItem('trl_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
