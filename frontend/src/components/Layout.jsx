import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Truck, LayoutDashboard, Users, Route as RouteIcon, Building2, LogOut, MapPinned, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-trl-trim.png';

const itens = [
  { to: '/', label: 'Painel', icone: LayoutDashboard, fim: true },
  { to: '/rotas', label: 'Rotas', icone: RouteIcon },
  { to: '/trajetos-fixos', label: 'Trajetos fixos', icone: MapPinned },
  { to: '/motoristas', label: 'Motoristas', icone: Users },
  { to: '/veiculos', label: 'Veiculos', icone: Truck },
  { to: '/clientes', label: 'Clientes', icone: Building2 },
];

export default function Layout({ children }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('trl_tema') === 'escuro');

  useEffect(() => {
    localStorage.setItem('trl_tema', temaEscuro ? 'escuro' : 'claro');
  }, [temaEscuro]);

  function handleSair() {
    sair();
    navigate('/login');
  }

  return (
    <div className="layout" data-theme={temaEscuro ? 'dark' : 'light'}>
      <aside className="barra-lateral">
        <div className="logo">
          <img src={logo} alt="TRL Transportes" style={{ width: '100%', maxWidth: 150, height: 'auto' }} />
        </div>
        {itens.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.fim}
            className={({ isActive }) => 'nav-link' + (isActive ? ' ativo' : '')}
          >
            <item.icone size={18} />
            {item.label}
          </NavLink>
        ))}
      </aside>
      <div className="conteudo">
        <header className="topo">
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="btn btn-texto"
              title={temaEscuro ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              onClick={() => setTemaEscuro((atual) => !atual)}
            >
              {temaEscuro ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span style={{ fontSize: 14, color: 'var(--cinza-texto)' }}>
              {usuario?.nome} <span className="badge badge-azul">{usuario?.papel}</span>
            </span>
            <button className="btn btn-texto" onClick={handleSair}>
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>
        <main className="pagina">{children}</main>
      </div>
    </div>
  );
}
