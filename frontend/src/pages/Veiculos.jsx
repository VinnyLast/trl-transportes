import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Power, PowerOff } from 'lucide-react';
import api, { mensagemErroApi } from '../api/client';

const vazio = { placa: '', modelo: '', capacidadeCarga: '', status: 'ATIVO' };

const statusRotulo = { ATIVO: 'Ativo', MANUTENCAO: 'Em manutencao', INATIVO: 'Inativo' };
const statusClasse = { ATIVO: 'badge-verde', MANUTENCAO: 'badge-vermelho', INATIVO: 'badge-cinza' };

export default function Veiculos() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await api.get('/veiculos', { params: { busca: busca || undefined } });
    setLista(res.data);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function abrirNovo() {
    setForm(vazio);
    setEditandoId(null);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(v) {
    setForm({ placa: v.placa, modelo: v.modelo, capacidadeCarga: v.capacidadeCarga || '', status: v.status });
    setEditandoId(v.id);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/veiculos/${editandoId}`, form);
      } else {
        await api.post('/veiculos', form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(mensagemErroApi(err, 'Erro ao salvar veiculo.'));
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este veiculo? Esta acao nao pode ser desfeita.')) return;
    try {
      await api.delete(`/veiculos/${id}`);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao excluir veiculo.');
    }
  }

  async function alternarStatus(veiculo) {
    const novoStatus = veiculo.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await api.put(`/veiculos/${veiculo.id}`, { status: novoStatus });
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao atualizar status do veiculo.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Veiculos</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          <Plus size={16} /> Novo veiculo
        </button>
      </div>

      <div className="filtros">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
          <input style={{ paddingLeft: 30 }} placeholder="Buscar por placa ou modelo" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhum veiculo cadastrado.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Capacidade</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id}>
                    <td>{v.placa}</td>
                    <td>{v.modelo}</td>
                    <td>{v.capacidadeCarga || '-'}</td>
                    <td><span className={`badge ${statusClasse[v.status]}`}>{statusRotulo[v.status]}</span></td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn btn-texto"
                          title={v.status === 'ATIVO' ? 'Desativar veiculo' : 'Ativar veiculo'}
                          onClick={() => alternarStatus(v)}
                        >
                          {v.status === 'ATIVO' ? <PowerOff size={16} color="#d1273d" /> : <Power size={16} color="#1a7f4e" />}
                        </button>
                        <button className="btn btn-texto" onClick={() => abrirEdicao(v)}><Pencil size={16} /></button>
                        <button className="btn btn-texto" title="Excluir permanentemente" onClick={() => excluir(v.id)}><Trash2 size={16} color="#d1273d" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="modal-fundo" onClick={() => setModalAberto(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
            <div className="modal-cabecalho">
              <h2 style={{ margin: 0, fontSize: 18 }}>{editandoId ? 'Editar veiculo' : 'Novo veiculo'}</h2>
              <button type="button" className="btn btn-texto" onClick={() => setModalAberto(false)}><X size={18} /></button>
            </div>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="grade-form">
              <div className="campo">
                <label>Placa</label>
                <input required placeholder="ABC1234 ou ABC1D23" value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value })} />
              </div>
              <div className="campo">
                <label>Modelo / tipo do caminhao</label>
                <input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
              </div>
              <div className="campo">
                <label>Capacidade de carga (opcional)</label>
                <input value={form.capacidadeCarga} onChange={(e) => setForm({ ...form, capacidadeCarga: e.target.value })} />
              </div>
              <div className="campo">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ATIVO">Ativo</option>
                  <option value="MANUTENCAO">Em manutencao</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secundario" onClick={() => setModalAberto(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primario">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
