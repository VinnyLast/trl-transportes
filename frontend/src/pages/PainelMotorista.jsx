import { useEffect, useState } from 'react';
import { PlayCircle, StopCircle, LogOut, Truck, Camera } from 'lucide-react';
import motoristaApi, { limparSessaoMotorista } from '../api/motoristaClient';
import logo from '../assets/logo-trl-trim.png';
import Rodape from '../components/Rodape';

function formatarCpfDigitado(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

const ORIGEM_PADRAO = 'FEC-BA';

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
  const [origem, setOrigem] = useState(ORIGEM_PADRAO);
  const [destino, setDestino] = useState('');
  const [fotoRomaneio, setFotoRomaneio] = useState(null);
  const [previewRomaneio, setPreviewRomaneio] = useState('');
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

  useEffect(() => {
    return () => {
      if (previewRomaneio) URL.revokeObjectURL(previewRomaneio);
    };
  }, [previewRomaneio]);

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

  function selecionarFoto(arquivo) {
    if (previewRomaneio) URL.revokeObjectURL(previewRomaneio);
    setFotoRomaneio(arquivo || null);
    setPreviewRomaneio(arquivo ? URL.createObjectURL(arquivo) : '');
  }

  function limparFormularioRota() {
    setVeiculoId('');
    setOrigem(ORIGEM_PADRAO);
    setDestino('');
    selecionarFoto(null);
  }

  async function iniciarRota(e) {
    e.preventDefault();
    setErro('');

    if (!veiculoId) {
      setErro('Selecione o veiculo.');
      return;
    }
    if (!fotoRomaneio) {
      setErro('Envie a foto do romaneio para iniciar a rota.');
      return;
    }

    setCarregando(true);
    try {
      const dadosFormulario = new FormData();
      dadosFormulario.append('veiculoId', veiculoId);
      dadosFormulario.append('origem', origem);
      dadosFormulario.append('destino', destino);
      dadosFormulario.append('romaneio', fotoRomaneio);

      const res = await motoristaApi.post('/motorista-app/iniciar', dadosFormulario);
      setRotaAtiva(res.data.rota);
      const horario = new Date(res.data.rota.dataSaida).toLocaleTimeString('pt-BR');
      setMensagem(
        res.data.trajetoFixo
          ? `Rota iniciada as ${horario}. Trajeto fixo identificado.`
          : `Rota iniciada as ${horario}.`
      );
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
      limparFormularioRota();
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

            <a href="/login" className="link-motorista">Sou administrador, fazer login</a>
          </form>
        </div>
        <Rodape />
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
              <span className="rotulo">{rotaAtiva.origem} &rarr; {rotaAtiva.destino}</span>
              <span className="rotulo">Saida: {new Date(rotaAtiva.dataSaida).toLocaleString('pt-BR')}</span>
            </div>

            <button className="btn btn-perigo btn-gigante" onClick={finalizarRota} disabled={carregando}>
              <StopCircle size={22} />
              {carregando ? 'Finalizando...' : 'Finalizar rota'}
            </button>
          </div>
        ) : (
          <form onSubmit={iniciarRota}>
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

            <div className="campo">
              <label htmlFor="origem-motorista">Origem</label>
              <input
                id="origem-motorista"
                className="input-grande"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="destino-motorista">Destino</label>
              <input
                id="destino-motorista"
                className="input-grande"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="romaneio-motorista">Foto do romaneio</label>
              <label htmlFor="romaneio-motorista" className="btn btn-secundario btn-gigante" style={{ cursor: 'pointer' }}>
                <Camera size={20} />
                {fotoRomaneio ? 'Trocar foto' : 'Tirar / escolher foto'}
              </label>
              <input
                id="romaneio-motorista"
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => selecionarFoto(e.target.files?.[0] || null)}
              />
              {previewRomaneio && (
                <img
                  src={previewRomaneio}
                  alt="Previa do romaneio"
                  style={{ marginTop: 10, maxWidth: '100%', borderRadius: 12, border: '1px solid var(--cinza-borda)' }}
                />
              )}
            </div>

            <button type="submit" className="btn btn-primario btn-gigante" disabled={carregando}>
              <PlayCircle size={22} />
              {carregando ? 'Iniciando...' : 'Iniciar rota'}
            </button>
          </form>
        )}

        <button className="btn btn-texto btn-trocar" onClick={sair}>
          <LogOut size={14} /> Sair
        </button>
      </div>
      <Rodape />
    </div>
  );
}
