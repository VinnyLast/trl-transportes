import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Power, PowerOff, MapPinned } from 'lucide-react';
import api, { mensagemErroApi } from '../api/client';

const vazio = { origem: '', destino: '', valor: '', status: 'ATIVO' };

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function TrajetosFixos() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await api.get('/trajetos-fixos', { params: { busca: busca || undefined } });
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

  function abrirEdicao(t) {
    setForm({ origem: t.origem, destino: t.destino, valor: t.valor, status: t.status });
    setEditandoId(t.id);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/trajetos-fixos/${editandoId}`, form);
      } else {
        await api.post('/trajetos-fixos', form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(mensagemErroApi(err, 'Erro ao salvar trajeto fixo.'));
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este trajeto fixo? Esta acao nao pode ser desfeita.')) return;
    try {
      await api.delete(`/trajetos-fixos/${id}`);
      carregar();
    } catch (err) {
      alert(mensagemErroApi(err, 'Erro ao excluir trajeto fixo.'));
    }
  }

  async function alternarStatus(trajeto) {
    const novoStatus = trajeto.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await api.put(`/trajetos-fixos/${trajeto.id}`, { status: novoStatus });
      carregar();
    } catch (err) {
      alert(mensagemErroApi(err, 'Erro ao atualizar status do trajeto.'));
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Trajetos fixos</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          <Plus size={16} /> Novo trajeto fixo
        </button>
      </div>

      <p style={{ color: 'var(--cinza-texto)', fontSize: 13, marginTop: -12, marginBottom: 20 }}>
        Cadastre aqui os trajetos com valor pre-definido (ex.: Salvador para Feira de Santana = R$ 350,00).
        Quando uma rota tiver a mesma origem e destino de um trajeto fixo ativo, o valor e preenchido
        automaticamente — tanto na criacao manual quanto quando o motorista inicia a rota pelo aplicativo.
        Rotas fora desta tabela continuam com valor livre.
      </p>

      <div className="filtros">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
          <input style={{ paddingLeft: 30 }} placeholder="Buscar por origem ou destino" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">
            <MapPinned size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>Nenhum trajeto fixo cadastrado ainda.</div>
          </div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Origem</th>
                  <th>Destino</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((t) => (
                  <tr key={t.id}>
                    <td>{t.origem}</td>
                    <td>{t.destino}</td>
                    <td>{formatarMoeda(t.valor)}</td>
                    <td>
                      <span className={`badge ${t.status === 'ATIVO' ? 'badge-verde' : 'badge-cinza'}`}>
                        {t.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn btn-texto"
                          title={t.status === 'ATIVO' ? 'Desativar trajeto' : 'Ativar trajeto'}
                          onClick={() => alternarStatus(t)}
                        >
                          {t.status === 'ATIVO' ? <PowerOff size={16} color="#d1273d" /> : <Power size={16} color="#1a7f4e" />}
                        </button>
                        <button className="btn btn-texto" onClick={() => abrirEdicao(t)}><Pencil size={16} /></button>
                        <button className="btn btn-texto" title="Excluir permanentemente" onClick={() => excluir(t.id)}><Trash2 size={16} color="#d1273d" /></button>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editandoId ? 'Editar trajeto fixo' : 'Novo trajeto fixo'}</h2>
              <button type="button" className="btn btn-texto" onClick={() => setModalAberto(false)}><X size={18} /></button>
            </div>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="grade-form">
              <div className="campo">
                <label>Origem</label>
                <input required value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
              </div>
              <div className="campo">
                <label>Destino</label>
                <input required value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
              </div>
              <div className="campo">
                <label>Valor fixo (R$)</label>
                <input required type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div className="campo">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ATIVO">Ativo</option>
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
