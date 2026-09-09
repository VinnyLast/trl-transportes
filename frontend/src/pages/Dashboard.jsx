import { useEffect, useState } from 'react';
import { Route as RouteIcon, Truck, Wallet, Clock } from 'lucide-react';
import api from '../api/client';

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [rotasRecentes, setRotasRecentes] = useState([]);

  useEffect(() => {
    api.get('/rotas/resumo').then((res) => setResumo(res.data));
    api.get('/rotas').then((res) => setRotasRecentes(res.data.slice(0, 8)));
  }, []);

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
