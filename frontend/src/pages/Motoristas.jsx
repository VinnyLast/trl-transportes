import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Smartphone, ShieldOff, Power, PowerOff } from 'lucide-react';
import api, { mensagemErroApi } from '../api/client';

const vazio = { nome: '', cpf: '', cnhNumero: '', cnhCategoria: '', telefone: '', status: 'ATIVO', senha: '' };

export default function Motoristas() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [temSenha, setTemSenha] = useState(false);
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
    setTemSenha(false);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(motorista) {
    setForm({
      nome: motorista.nome,
      cpf: motorista.cpf,
      cnhNumero: motorista.cnhNumero || '',
      cnhCategoria: motorista.cnhCategoria || '',
      telefone: motorista.telefone,
      status: motorista.status,
      senha: '',
    });
    setEditandoId(motorista.id);
    setTemSenha(Boolean(motorista.temSenha));
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
      setErro(mensagemErroApi(err, 'Erro ao salvar motorista.'));
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

  async function alternarStatus(motorista) {
    const novoStatus = motorista.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    try {
      await api.put(`/motoristas/${motorista.id}`, { status: novoStatus });
      carregar();
    } catch (err) {
      alert(err.response?.data?.erro || 'Erro ao atualizar status do motorista.');
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
                  <th>App do motorista</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{m.cpf}</td>
                    <td>{m.cnhNumero || m.cnhCategoria ? `${m.cnhNumero || '-'} / ${m.cnhCategoria || '-'}` : '-'}</td>
                    <td>{m.telefone}</td>
                    <td>
                      <span className={`badge ${m.status === 'ATIVO' ? 'badge-verde' : 'badge-cinza'}`}>
                        {m.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {m.temSenha ? (
                        <span className="badge badge-azul"><Smartphone size={12} /> Habilitado</span>
                      ) : (
                        <span className="badge badge-cinza"><ShieldOff size={12} /> Sem acesso</span>
                      )}
                    </td>
                    <td>
                      <div className="acoes-tabela">
                        <button
                          className="btn btn-texto"
                          title={m.status === 'ATIVO' ? 'Desativar motorista' : 'Ativar motorista'}
                          onClick={() => alternarStatus(m)}
                        >
                          {m.status === 'ATIVO' ? <PowerOff size={16} color="#d1273d" /> : <Power size={16} color="#1a7f4e" />}
                        </button>
                        <button className="btn btn-texto" onClick={() => abrirEdicao(m)}>
                          <Pencil size={16} />
                        </button>
                        <button className="btn btn-texto" title="Excluir permanentemente" onClick={() => excluir(m.id)}>
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
                <label>Numero da CNH (opcional)</label>
                <input value={form.cnhNumero} onChange={(e) => setForm({ ...form, cnhNumero: e.target.value })} />
              </div>
              <div className="campo">
                <label>Categoria da CNH (opcional)</label>
                <input placeholder="Ex.: E" value={form.cnhCategoria} onChange={(e) => setForm({ ...form, cnhCategoria: e.target.value })} />
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

            <div className="campo">
              <label>
                Senha de acesso ao aplicativo do motorista
                {editandoId && (temSenha ? ' (deixe em branco para manter a atual)' : ' (ainda nao definida)')}
              </label>
              <input
                type="password"
                placeholder="Minimo 4 caracteres"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
              />
              <span style={{ fontSize: 12, color: 'var(--cinza-texto)' }}>
                O motorista usa o CPF e esta senha para entrar no aplicativo (em /motorista) e registrar o inicio e o fim das rotas.
              </span>
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
