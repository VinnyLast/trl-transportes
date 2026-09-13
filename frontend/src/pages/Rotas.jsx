import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, CheckCircle2, XCircle, Download } from 'lucide-react';
import api, { mensagemErroApi } from '../api/client';

const vazio = {
  motoristaId: '',
  veiculoId: '',
  clienteId: '',
  origem: '',
  destino: '',
  dataSaida: '',
  dataChegada: '',
  valor: '',
  observacoes: '',
  status: 'AGENDADA',
};

const statusRotulo = {
  AGENDADA: 'Agendada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluida',
  CANCELADA: 'Cancelada',
};

const statusClasse = {
  AGENDADA: 'badge-azul',
  EM_ANDAMENTO: 'badge-vermelho',
  CONCLUIDA: 'badge-verde',
  CANCELADA: 'badge-cinza',
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function paraInputDatetime(data) {
  if (!data) return '';
  const d = new Date(data);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function Rotas() {
  const [lista, setLista] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [trajetosFixos, setTrajetosFixos] = useState([]);
  const [filtros, setFiltros] = useState({ status: '', motoristaId: '', veiculoId: '', dataInicio: '', dataFim: '' });
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');

  async function carregarAuxiliares() {
    const [m, v, c, t] = await Promise.all([
      api.get('/motoristas', { params: { status: 'ATIVO' } }),
      api.get('/veiculos', { params: { status: 'ATIVO' } }),
      api.get('/clientes', { params: { status: 'ATIVO' } }),
      api.get('/trajetos-fixos', { params: { status: 'ATIVO' } }),
    ]);
    setMotoristas(m.data);
    setVeiculos(v.data);
    setClientes(c.data);
    setTrajetosFixos(t.data);
  }

  function buscarValorTrajetoFixo(origem, destino) {
    const encontrado = trajetosFixos.find(
      (t) => t.origem.trim().toLowerCase() === origem.trim().toLowerCase() && t.destino.trim().toLowerCase() === destino.trim().toLowerCase()
    );
    return encontrado ? encontrado.valor : null;
  }

  function aoSairDoCampoOrigemDestino(origemAtual, destinoAtual) {
    if (!origemAtual || !destinoAtual) return;
    const valorFixo = buscarValorTrajetoFixo(origemAtual, destinoAtual);
    if (valorFixo !== null && (form.valor === '' || form.valor === undefined)) {
      setForm((atual) => ({ ...atual, valor: valorFixo }));
    }
  }

  async function carregar() {
    const params = {};
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor) params[chave] = valor;
    });
    const res = await api.get('/rotas', { params });
    setLista(res.data);
  }

  useEffect(() => {
    carregarAuxiliares();
  }, []);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  function abrirNovo() {
    setForm(vazio);
    setEditandoId(null);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(rota) {
    setForm({
      motoristaId: rota.motoristaId,
      veiculoId: rota.veiculoId,
      clienteId: rota.clienteId || '',
      origem: rota.origem,
      destino: rota.destino,
      dataSaida: paraInputDatetime(rota.dataSaida),
      dataChegada: paraInputDatetime(rota.dataChegada),
      valor: rota.valor,
      observacoes: rota.observacoes || '',
      status: rota.status,
    });
    setEditandoId(rota.id);
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    const payload = {
      ...form,
      clienteId: form.clienteId || null,
      dataChegada: form.dataChegada || null,
      valor: Number(form.valor),
    };
    try {
      if (editandoId) {
        await api.put(`/rotas/${editandoId}`, payload);
      } else {
        await api.post('/rotas', payload);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(mensagemErroApi(err, 'Erro ao salvar rota.'));
    }
  }

  async function finalizar(id) {
    if (!window.confirm('Finalizar esta rota e registrar a chegada agora?')) return;
    await api.post(`/rotas/${id}/finalizar`);
    carregar();
  }

  async function cancelar(id) {
    if (!window.confirm('Cancelar esta rota?')) return;
    await api.post(`/rotas/${id}/cancelar`);
    carregar();
  }

  async function excluir(id) {
    if (!window.confirm('Excluir esta rota permanentemente?')) return;
    await api.delete(`/rotas/${id}`);
    carregar();
  }

  function exportarCsv() {
    const cabecalho = ['Motorista', 'Veiculo', 'Cliente', 'Origem', 'Destino', 'Saida', 'Chegada', 'Valor', 'Status'];
    const linhas = lista.map((r) => [
      r.motorista?.nome,
      r.veiculo?.placa,
      r.cliente?.nome || '',
      r.origem,
      r.destino,
      new Date(r.dataSaida).toLocaleString('pt-BR'),
      r.dataChegada ? new Date(r.dataChegada).toLocaleString('pt-BR') : '',
      Number(r.valor).toFixed(2).replace('.', ','),
      statusRotulo[r.status],
    ]);
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotas-trl-transportes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Rotas de entrega</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secundario" onClick={exportarCsv}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-primario" onClick={abrirNovo}>
            <Plus size={16} /> Nova rota
          </button>
        </div>
      </div>

      <div className="filtros">
        <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
          <option value="">Todos os status</option>
          <option value="AGENDADA">Agendada</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="CONCLUIDA">Concluida</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <select value={filtros.motoristaId} onChange={(e) => setFiltros({ ...filtros, motoristaId: e.target.value })}>
          <option value="">Todos os motoristas</option>
          {motoristas.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
        <select value={filtros.veiculoId} onChange={(e) => setFiltros({ ...filtros, veiculoId: e.target.value })}>
          <option value="">Todos os veiculos</option>
          {veiculos.map((v) => (
            <option key={v.id} value={v.id}>{v.placa}</option>
          ))}
        </select>
        <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
        <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div className="vazio">Nenhuma rota encontrada para os filtros selecionados.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Motorista</th>
                  <th>Veiculo</th>
                  <th>Origem / Destino</th>
                  <th>Saida</th>
                  <th>Chegada</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((rota) => (
                  <tr key={rota.id}>
                    <td>{rota.motorista?.nome}</td>
                    <td>{rota.veiculo?.placa}</td>
                    <td>{rota.origem} &rarr; {rota.destino}</td>
                    <td>{new Date(rota.dataSaida).toLocaleString('pt-BR')}</td>
                    <td>{rota.dataChegada ? new Date(rota.dataChegada).toLocaleString('pt-BR') : '-'}</td>
                    <td>{formatarMoeda(rota.valor)}</td>
                    <td><span className={`badge ${statusClasse[rota.status]}`}>{statusRotulo[rota.status]}</span></td>
                    <td>
                      <div className="acoes-tabela">
                        {rota.status !== 'CONCLUIDA' && rota.status !== 'CANCELADA' && (
                          <button className="btn btn-texto" title="Finalizar rota" onClick={() => finalizar(rota.id)}>
                            <CheckCircle2 size={16} color="#1a7f4e" />
                          </button>
                        )}
                        {rota.status !== 'CANCELADA' && rota.status !== 'CONCLUIDA' && (
                          <button className="btn btn-texto" title="Cancelar rota" onClick={() => cancelar(rota.id)}>
                            <XCircle size={16} color="#d1273d" />
                          </button>
                        )}
                        <button className="btn btn-texto" onClick={() => abrirEdicao(rota)}><Pencil size={16} /></button>
                        <button className="btn btn-texto" onClick={() => excluir(rota.id)}><Trash2 size={16} color="#d1273d" /></button>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editandoId ? 'Editar rota' : 'Nova rota'}</h2>
              <button type="button" className="btn btn-texto" onClick={() => setModalAberto(false)}><X size={18} /></button>
            </div>

            {erro && <div className="aviso-erro">{erro}</div>}

            <div className="grade-form">
              <div className="campo">
                <label>Motorista</label>
                <select required value={form.motoristaId} onChange={(e) => setForm({ ...form, motoristaId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {motoristas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Veiculo</label>
                <select required value={form.veiculoId} onChange={(e) => setForm({ ...form, veiculoId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Cliente (opcional)</label>
                <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                  <option value="">Nenhum</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="AGENDADA">Agendada</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="CONCLUIDA">Concluida</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
              <div className="campo">
                <label>Origem</label>
                <input
                  required
                  value={form.origem}
                  onChange={(e) => setForm({ ...form, origem: e.target.value })}
                  onBlur={() => aoSairDoCampoOrigemDestino(form.origem, form.destino)}
                />
              </div>
              <div className="campo">
                <label>Destino</label>
                <input
                  required
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  onBlur={() => aoSairDoCampoOrigemDestino(form.origem, form.destino)}
                />
              </div>
              <div className="campo">
                <label>Data/hora de saida</label>
                <input required type="datetime-local" value={form.dataSaida} onChange={(e) => setForm({ ...form, dataSaida: e.target.value })} />
              </div>
              <div className="campo">
                <label>Data/hora de chegada (opcional)</label>
                <input type="datetime-local" value={form.dataChegada} onChange={(e) => setForm({ ...form, dataChegada: e.target.value })} />
              </div>
              <div className="campo">
                <label>
                  Valor da rota (R$)
                  {buscarValorTrajetoFixo(form.origem, form.destino) !== null && (
                    <span className="badge badge-azul" style={{ marginLeft: 8, fontSize: 11 }}>Trajeto fixo</span>
                  )}
                </label>
                <input required type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
            </div>

            <div className="campo">
              <label>Observacoes</label>
              <textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
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
