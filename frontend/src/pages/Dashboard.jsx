import { useEffect, useState } from 'react';
import { Route as RouteIcon, Truck, Wallet, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import api from '../api/client';

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarMoedaCurta(valor) {
  const n = Number(valor || 0);
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return `R$ ${n.toFixed(0)}`;
}

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

const CORES = {
  azul: '#0b3d91',
  azulClaro: '#5b8def',
  vermelho: '#d1273d',
  verde: '#1a7f4e',
  cinza: '#9ca3af',
};

const CORES_STATUS = {
  Agendada: CORES.azulClaro,
  'Em andamento': CORES.vermelho,
  Concluida: CORES.verde,
  Cancelada: CORES.cinza,
};

function TooltipPersonalizado({ active, payload, label, formatador }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--branco)',
      border: '1px solid var(--cinza-borda)',
      borderRadius: 8,
      padding: '10px 12px',
      boxShadow: 'var(--sombra)',
      fontSize: 13,
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>}
      {payload.map((item) => (
        <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, color: item.color }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--cinza-texto-forte)' }}>
            {item.name}: <strong>{formatador ? formatador(item.value) : item.value}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [rotasRecentes, setRotasRecentes] = useState([]);
  const [graficoMensal, setGraficoMensal] = useState([]);
  const [rankingMotoristas, setRankingMotoristas] = useState([]);

  useEffect(() => {
    api.get('/rotas/resumo').then((res) => setResumo(res.data));
    api.get('/rotas').then((res) => setRotasRecentes(res.data.slice(0, 8)));
    api.get('/rotas/grafico-mensal', { params: { meses: 6 } }).then((res) => setGraficoMensal(res.data));
    api.get('/rotas/grafico-motoristas', { params: { limite: 6 } }).then((res) => setRankingMotoristas(res.data));
  }, []);

  const dadosStatus = resumo
    ? [
        { nome: 'Agendada', valor: resumo.agendadas },
        { nome: 'Em andamento', valor: resumo.emAndamento },
        { nome: 'Concluida', valor: resumo.concluidas },
        { nome: 'Cancelada', valor: resumo.canceladas },
      ].filter((item) => item.valor > 0)
    : [];

  return (
    <div>
      <div className="cabecalho-pagina">
        <h1>Painel</h1>
      </div>

      <div className="grade-cartoes">
        <div className="cartao-indicador">
          <span className="rotulo"><RouteIcon size={16} /> Rotas no periodo</span>
          <span className="valor">{resumo?.total ?? '-'}</span>
        </div>
        <div className="cartao-indicador">
          <span className="rotulo"><Clock size={16} /> Em andamento</span>
          <span className="valor">{resumo?.emAndamento ?? '-'}</span>
        </div>
        <div className="cartao-indicador">
          <span className="rotulo"><Truck size={16} /> Concluidas</span>
          <span className="valor">{resumo?.concluidas ?? '-'}</span>
        </div>
        <div className="cartao-indicador">
          <span className="rotulo"><Wallet size={16} /> Valor total a pagar</span>
          <span className="valor">{formatarMoeda(resumo?.valorTotal)}</span>
        </div>
      </div>

      <div className="grade-graficos">
        <div className="card">
          <h2 className="titulo-grafico">Rotas e valor por mes</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={graficoMensal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="rotulo" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#dfe2e8' }} tickLine={false} />
              <YAxis
                yAxisId="valor"
                tickFormatter={formatarMoedaCurta}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis yAxisId="quantidade" orientation="right" hide />
              <Tooltip
                content={
                  <TooltipPersonalizado
                    formatador={(v) => (typeof v === 'number' && v > 100 ? formatarMoeda(v) : v)}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar yAxisId="valor" dataKey="valor" name="Valor (R$)" fill={CORES.azul} radius={[6, 6, 0, 0]} maxBarSize={42} />
              <Line
                yAxisId="quantidade"
                type="monotone"
                dataKey="quantidade"
                name="Qtde. de rotas"
                stroke={CORES.vermelho}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CORES.vermelho }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="titulo-grafico">Rotas por status</h2>
          {dadosStatus.length === 0 ? (
            <div className="vazio">Sem dados suficientes ainda.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dadosStatus}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  cornerRadius={4}
                >
                  {dadosStatus.map((item) => (
                    <Cell key={item.nome} fill={CORES_STATUS[item.nome]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPersonalizado />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13 }}
                  formatter={(value) => <span style={{ color: 'var(--cinza-texto-forte)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 className="titulo-grafico">Motoristas por valor gerado</h2>
        {rankingMotoristas.length === 0 ? (
          <div className="vazio">Sem dados suficientes ainda.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(rankingMotoristas.length * 48, 120)}>
            <BarChart
              data={rankingMotoristas}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              barCategoryGap={14}
            >
              <CartesianGrid stroke="#eef0f3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatarMoedaCurta} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 13, fill: 'var(--cinza-texto-forte)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<TooltipPersonalizado formatador={formatarMoeda} />} />
              <Bar dataKey="valor" name="Valor gerado" fill={CORES.azul} radius={[0, 6, 6, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Rotas recentes</h2>
        {rotasRecentes.length === 0 ? (
          <div className="vazio">Nenhuma rota registrada ainda.</div>
        ) : (
          <div className="rodape-tabela">
            <table>
              <thead>
                <tr>
                  <th>Motorista</th>
                  <th>Veiculo</th>
                  <th>Destino</th>
                  <th>Saida</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rotasRecentes.map((rota) => (
                  <tr key={rota.id}>
                    <td>{rota.motorista?.nome}</td>
                    <td>{rota.veiculo?.placa}</td>
                    <td>{rota.destino}</td>
                    <td>{new Date(rota.dataSaida).toLocaleString('pt-BR')}</td>
                    <td>{formatarMoeda(rota.valor)}</td>
                    <td>
                      <span className={`badge ${statusClasse[rota.status]}`}>{statusRotulo[rota.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
