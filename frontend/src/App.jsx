import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import PainelMotorista from './pages/PainelMotorista';
import Dashboard from './pages/Dashboard';
import Motoristas from './pages/Motoristas';
import Veiculos from './pages/Veiculos';
import Clientes from './pages/Clientes';
import Rotas from './pages/Rotas';

function RotaPrivada({ children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/motorista" element={<PainelMotorista />} />
      <Route path="/" element={<RotaPrivada><Dashboard /></RotaPrivada>} />
      <Route path="/rotas" element={<RotaPrivada><Rotas /></RotaPrivada>} />
      <Route path="/motoristas" element={<RotaPrivada><Motoristas /></RotaPrivada>} />
      <Route path="/veiculos" element={<RotaPrivada><Veiculos /></RotaPrivada>} />
      <Route path="/clientes" element={<RotaPrivada><Clientes /></RotaPrivada>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
