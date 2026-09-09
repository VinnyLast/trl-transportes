import { useEffect, useState } from 'react';
import { PlayCircle, StopCircle, LogOut, Truck } from 'lucide-react';
import motoristaApi, { limparSessaoMotorista } from '../api/motoristaClient';
import logo from '../assets/logo-trl-trim.png';

function formatarCpfDigitado(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function PainelMotorista() {
  const [logado, setLogado] = useState(() => Boolean(localStorage.getItem('trl_motorista_token')));
  const [nome, setNome] = useState(() => localStorage.getItem('trl_motorista_nome') || '');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [rotaAtiva, setRotaAtiva] = useState(null);
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoId, setVeiculoId] = useState('');
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  async function carregarStatus() {
    setCarregandoStatus(true);
    try {
      const res = await motoristaApi.get('/motorista-app/status');
      setRotaAtiva(res.data.rotaAtiva);
      if (!res.data.rotaAtiva) {
        const resVeiculos = await motoristaApi.get('/motorista-app/veiculos');
        setVeiculos(resVeiculos.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        limparSessaoMotorista();
        setLogado(false);
      }
    } finally {
      setCarregandoStatus(false);
    }
  }

  useEffect(() => {
    if (logado) carregarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logado]);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const res = await motoristaApi.post('/motorista-app/login', { cpf, senha });
      localStorage.setItem('trl_motorista_token', res.data.token);
      localStorage.setItem('trl_motorista_nome', res.data.motorista.nome);
      setNome(res.data.motorista.nome);
      setLogado(true);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel entrar. Verifique CPF e senha.');
    } finally {
      setCarregando(false);
    }
  }

  function sair() {
    limparSessaoMotorista();
    setLogado(false);
    setCpf('');
    setSenha('');
    setRotaAtiva(null);
    setMensagem('');
    setErro('');
  }

  async function iniciarRota() {
    if (!veiculoId) {
      setErro('Selecione o veiculo.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const res = await motoristaApi.post('/motorista-app/iniciar', { veiculoId });
      setRotaAtiva(res.data.rota);
      setMensagem(`Rota iniciada as ${new Date(res.data.rota.dataSaida).toLocaleTimeString('pt-BR')}.`);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel iniciar a rota.');
    } finally {
      setCarregando(false);
    }
  }

  async function finalizarRota() {
    setErro('');
    setCarregando(true);
    try {
      const res = await motoristaApi.post('/motorista-app/finalizar');
      setRotaAtiva(null);
      setMensagem(`Rota finalizada as ${new Date(res.data.rota.dataChegada).toLocaleTimeString('pt-BR')}.`);
      const resVeiculos = await motoristaApi.get('/motorista-app/veiculos');
      setVeiculos(resVeiculos.data);
      setVeiculoId('');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Nao foi possivel finalizar a rota.');
    } finally {
      setCarregando(false);
    }
  }

  if (!logado) {
    return (
      <div className="tela-motorista">
        <div className="caixa-motorista">
          <img src={logo} alt="TRL Transportes" className="logo-motorista" />
          <form onSubmit={entrar}>
            <h1>Acesso do motorista</h1>
            <p className="subtitulo-motorista">Entre com seu CPF e senha</p>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="campo">
              <label htmlFor="cpf-motorista">CPF</label>
              <input
                id="cpf-motorista"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatarCpfDigitado(e.target.value))}
                required
                autoFocus
                className="input-grande"
              />
            </div>

            <div className="campo">
              <label htmlFor="senha-motorista">Senha</label>
              <input
                id="senha-motorista"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="input-grande"
              />
            </div>

            <button type="submit" className="btn btn-primario btn-gigante" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="tela-motorista">
      <div className="caixa-motorista">
        <img src={logo} alt="TRL Transportes" className="logo-motorista" />

        <p className="saudacao-motorista">Ola, <strong>{nome}</strong></p>

        {erro && <div className="aviso-erro">{erro}</div>}
        {mensagem && <div className="aviso-sucesso">{mensagem}</div>}

        {carregandoStatus ? (
          <p className="subtitulo-motorista">Carregando...</p>
        ) : rotaAtiva ? (
          <div>
            <div className="cartao-rota-ativa">
              <span className="rotulo"><Truck size={16} /> Veiculo em uso</span>
              <span className="valor-destaque">{rotaAtiva.veiculo?.placa}</span>
              <span className="rotulo">Saida: {new Date(rotaAtiva.dataSaida).toLocaleString('pt-BR')}</span>
            </div>

            <button className="btn btn-perigo btn-gigante" onClick={finalizarRota} disabled={carregando}>
              <StopCircle size={22} />
              {carregando ? 'Finalizando...' : 'Finalizar rota'}
            </button>
          </div>
        ) : (
          <div>
            <div className="campo">
              <label htmlFor="veiculo-motorista">Veiculo</label>
              <select
                id="veiculo-motorista"
                className="input-grande"
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
              >
                <option value="">Selecione o veiculo...</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                ))}
              </select>
            </div>

            <button className="btn btn-primario btn-gigante" onClick={iniciarRota} disabled={carregando}>
              <PlayCircle size={22} />
              {carregando ? 'Iniciando...' : 'Iniciar rota'}
            </button>
          </div>
        )}

        <button className="btn btn-texto btn-trocar" onClick={sair}>
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
}
