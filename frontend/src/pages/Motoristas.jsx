import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import api from '../api/client';

const vazio = { nome: '', cpf: '', cnhNumero: '', cnhCategoria: '', telefone: '', status: 'ATIVO' };

export default function Motoristas() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await api.get('/motoristas', { params: { busca: busca || undefined } });
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

  function abrirEdicao(motorista) {
    setForm({
      nome: motorista.nome,
      cpf: motorista.cpf,
      cnhNumero: motorista.cnhNumero,
      cnhCategoria: motorista.cnhCategoria,
      telefone: motorista.telefone,
      status: motorista.status,
    });
    setEditandoId(motorista.id);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/motoristas/${editandoId}`, form);
      } else {
        await api.post('/motoristas', form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar motorista.');
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este motorista? Esta acao nao pode ser desfeita.')) return;
    try {
      await api.delete(`/motoristas/${id}`);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao excluir motorista.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Motoristas</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          <Plus size={16} /> Novo motorista
        </button>
      </div>

      <div className="filtros">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
          <input
            style={{ paddingLeft: 30 }}
            placeholder="Buscar por nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhum motorista cadastrado.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>CNH</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{m.cpf}</td>
                    <td>{m.cnhNumero} / {m.cnhCategoria}</td>
                    <td>{m.telefone}</td>
                    <td>
                      <span className={`badge ${m.status === 'ATIVO' ? 'badge-verde' : 'badge-cinza'}`}>
                        {m.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="acoes-tabela">
                        <button className="btn btn-texto" onClick={() => abrirEdicao(m)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn btn-texto" onClick={() => excluir(m.id)}>
                          <Trash2 size={16} color="#d1273d" />
                        </button>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editandoId ? 'Editar motorista' : 'Novo motorista'}</h2>
              <button type="button" className="btn btn-texto" onClick={() => setModalAberto(false)}>
                <X size={18} />
              </button>
            </div>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="grade-form">
              <div className="campo">
                <label>Nome completo</label>
                <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="campo">
                <label>CPF</label>
                <input required placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </div>
              <div className="campo">
                <label>Numero da CNH</label>
                <input required value={form.cnhNumero} onChange={(e) => setForm({ ...form, cnhNumero: e.target.value })} />
              </div>
              <div className="campo">
                <label>Categoria da CNH</label>
                <input required placeholder="Ex.: E" value={form.cnhCategoria} onChange={(e) => setForm({ ...form, cnhCategoria: e.target.value })} />
              </div>
              <div className="campo">
                <label>Telefone</label>
                <input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
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
