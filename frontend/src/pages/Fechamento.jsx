import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Wallet, Route as RouteIcon, Users } from 'lucide-react';
import api, { mensagemErroApi } from '../api/client';

const MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataCurta(texto) {
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

function quinzenaAtual() {
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1, quinzena: hoje.getDate() <= 15 ? 1 : 2 };
}

export default function Fechamento() {
  const [periodo, setPeriodo] = useState(quinzenaAtual);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [abertos, setAbertos] = useState({});

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const res = await api.get('/rotas/fechamento', { params: periodo });
      setDados(res.data);
      setAbertos({});
    } catch (err) {
      setErro(mensagemErroApi(err, 'Erro ao carregar o fechamento.'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  function alternar(motoristaId) {
    setAbertos((atual) => ({ ...atual, [motoristaId]: !atual[motoristaId] }));
  }

  function exportarCsv() {
    if (!dados) return;
    const linhas = [['Motorista', 'Inicio da rota', 'Termino', 'Veiculo', 'Origem', 'Destino', 'Status', 'Valor']];
    for (const m of dados.motoristas) {
      for (const r of m.rotas) {
        linhas.push([
          m.nome,
          new Date(r.dataSaida).toLocaleString('pt-BR'),
          r.dataChegada ? new Date(r.dataChegada).toLocaleString('pt-BR') : '',
          r.veiculo?.placa || '',
          r.origem,
          r.destino,
          r.status === 'EM_ANDAMENTO' ? 'Em andamento' : r.status === 'CONCLUIDA' ? 'Concluida' : 'Agendada',
          Number(r.valor).toFixed(2).replace('.', ','),
        ]);
      }
      linhas.push([`TOTAL ${m.nome}`, '', '', '', '', '', `${m.quantidade} rota(s)`, m.valorTotal.toFixed(2).replace('.', ',')]);
      linhas.push([]);
    }
    linhas.push(['TOTAL GERAL', '', '', '', '', '', `${dados.quantidade} rota(s)`, dados.valorTotal.toFixed(2).replace('.', ',')]);

    const csv = linhas
      .map((linha) => linha.map((campo) => `"${String(campo ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fechamento-${dados.ano}-${String(dados.mes).padStart(2, '0')}-quinzena${dados.quinzena}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const anoAtual = new Date().getFullYear();
  const anos = [anoAtual - 1, anoAtual, anoAtual + 1];

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Fechamento quinzenal</h1>
        <button className="btn btn-secundario" onClick={exportarCsv} disabled={!dados || dados.quantidade === 0}>
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <p style={{ color: 'var(--cinza-texto)', fontSize: 13, marginTop: -12, marginBottom: 20 }}>
        A rota entra na quinzena pela data de <strong>inicio</strong>: se comecou dia 15 e terminou dia 16,
        conta na 1a quinzena. Rotas canceladas nao entram no total.
      </p>

      <div className="filtros">
        <select value={periodo.quinzena} onChange={(e) => setPeriodo({ ...periodo, quinzena: Number(e.target.value) })}>
          <option value={1}>1a quinzena (dias 1 a 15)</option>
          <option value={2}>2a quinzena (dia 16 ao fim)</option>
        </select>
        <select value={periodo.mes} onChange={(e) => setPeriodo({ ...periodo, mes: Number(e.target.value) })}>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>{nome}</option>
          ))}
        </select>
        <select value={periodo.ano} onChange={(e) => setPeriodo({ ...periodo, ano: Number(e.target.value) })}>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {erro && <div className="aviso-erro">{erro}</div>}

      {dados && (
        <div className="grade-cartoes">
          <div className="cartao-indicador">
            <span className="rotulo"><RouteIcon size={16} /> Periodo</span>
            <span className="valor" style={{ fontSize: 20 }}>
              {formatarDataCurta(dados.dataInicio)} a {formatarDataCurta(dados.dataFim)}
            </span>
          </div>
          <div className="cartao-indicador">
            <span className="rotulo"><Users size={16} /> Rotas na quinzena</span>
            <span className="valor">{dados.quantidade}</span>
          </div>
          <div className="cartao-indicador">
            <span className="rotulo"><Wallet size={16} /> Total a pagar</span>
            <span className="valor">{formatarMoeda(dados.valorTotal)}</span>
          </div>
        </div>
      )}

      <div className="card">
        {carregando ? (
          <div className="vazio">Carregando...</div>
        ) : !dados || dados.motoristas.length === 0 ? (
          <div className="vazio">Nenhuma rota nesta quinzena.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Motorista</th>
                  <th>Rotas</th>
                  <th>Total a pagar</th>
                </tr>
              </thead>
              <tbody>
                {dados.motoristas.map((m) => (
                  <Fragment key={m.motoristaId}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => alternar(m.motoristaId)}>
                      <td style={{ width: 32 }}>
                        {abertos[m.motoristaId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td>
                        <strong>{m.nome}</strong>
                        {m.emAndamento > 0 && (
                          <span className="badge badge-vermelho" style={{ marginLeft: 8 }}>
                            {m.emAndamento} em andamento
                          </span>
                        )}
                      </td>
                      <td>{m.quantidade}</td>
                      <td><strong>{formatarMoeda(m.valorTotal)}</strong></td>
                    </tr>
                    {abertos[m.motoristaId] && m.rotas.map((r) => (
                      <tr key={r.id} style={{ fontSize: 13 }}>
                        <td></td>
                        <td style={{ color: 'var(--cinza-texto)' }}>
                          {new Date(r.dataSaida).toLocaleString('pt-BR')} &middot; {r.veiculo?.placa}
                        </td>
                        <td style={{ color: 'var(--cinza-texto)' }}>{r.origem} &rarr; {r.destino}</td>
                        <td>{formatarMoeda(r.valor)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
