import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, IdCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-trl-trim.png';
import Rodape from '../components/Rodape';

function formatarCpfDigitado(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('email'); // 'email' ou 'cpf'
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(modo === 'email' ? { email, senha } : { cpf, senha });
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel entrar. Verifique os dados.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-login">
      <form className="caixa-login" onSubmit={handleSubmit}>
        <div className="logo">
          <img src={logo} alt="TRL Transportes" style={{ width: 120, height: 'auto' }} />
          <span style={{ fontSize: 13, color: '#6b7280' }}>Controle de rotas de entrega</span>
        </div>

        {erro && <div className="aviso-erro">{erro}</div>}

        <div className="alternador-login">
          <button
            type="button"
            className={'aba-login' + (modo === 'email' ? ' ativa' : '')}
            onClick={() => setModo('email')}
          >
            <Mail size={14} /> E-mail
          </button>
          <button
            type="button"
            className={'aba-login' + (modo === 'cpf' ? ' ativa' : '')}
            onClick={() => setModo('cpf')}
          >
            <IdCard size={14} /> CPF
          </button>
        </div>

        {modo === 'email' ? (
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        ) : (
          <div className="campo">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatarCpfDigitado(e.target.value))}
              required
              autoFocus
            />
          </div>
        )}

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primario" type="submit" disabled={enviando} style={{ width: '100%', justifyContent: 'center' }}>
          <LogIn size={16} />
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

      </form>
      <Rodape />
    </div>
  );
}
