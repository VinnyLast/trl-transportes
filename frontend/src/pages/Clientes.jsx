import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import api from '../api/client';

const vazio = { nome: '', endereco: '', contato: '' };

export default function Clientes() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregar() {
    const res = await api.get('/clientes', { params: { busca: busca || undefined } });
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

  function abrirEdicao(c) {
    setForm({ nome: c.nome, endereco: c.endereco, contato: c.contato || '' });
    setEditandoId(c.id);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar cliente.');
    }
  }

  async function excluir(id) {
    if (!window.confirm('Excluir este cliente? Esta acao nao pode ser desfeita.')) return;
    try {
      await api.delete(`/clientes/${id}`);
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao excluir cliente.');
    }
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Clientes</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      <div className="filtros">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#9ca3af' }} />
          <input style={{ paddingLeft: 30 }} placeholder="Buscar por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhum cliente cadastrado.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Nome / Razao social</th>
                  <th>Endereco</th>
                  <th>Contato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td>{c.endereco}</td>
                    <td>{c.contato || '-'}</td>
                    <td>
                      <div className="acoes-tabela">
                        <button className="btn btn-texto" onClick={() => abrirEdicao(c)}><Pencil size={16} /></button>
                        <button className="btn btn-texto" onClick={() => excluir(c.id)}><Trash2 size={16} color="#d1273d" /></button>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editandoId ? 'Editar cliente' : 'Novo cliente'}</h2>
              <button type="button" className="btn btn-texto" onClick={() => setModalAberto(false)}><X size={18} /></button>
            </div>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="campo">
              <label>Nome / Razao social</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="campo">
              <label>Endereco de entrega</label>
              <input required value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div className="campo">
              <label>Contato (opcional)</label>
              <input value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
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
