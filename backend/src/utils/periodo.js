// Datas de filtro chegam como "AAAA-MM-DD". Elas sao interpretadas no fuso
// local (process.env.TZ = America/Bahia, definido em index.js): o inicio vai
// para 00:00:00 e o fim para 23:59:59.999 do proprio dia, para o dia final
// entrar inteiro no periodo.
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

function inicioDoDia(texto) {
  if (!FORMATO_DATA.test(String(texto))) return null;
  const data = new Date(`${texto}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function fimDoDia(texto) {
  if (!FORMATO_DATA.test(String(texto))) return null;
  const data = new Date(`${texto}T23:59:59.999`);
  return Number.isNaN(data.getTime()) ? null : data;
}

// Filtro do Prisma pela data de INICIO da rota (dataSaida): uma rota que
// comeca dia 1 e termina dia 2 conta no dia 1.
function filtroDataSaida(dataInicio, dataFim) {
  const filtro = {};
  const inicio = dataInicio ? inicioDoDia(dataInicio) : null;
  const fim = dataFim ? fimDoDia(dataFim) : null;
  if (inicio) filtro.gte = inicio;
  if (fim) filtro.lte = fim;
  return Object.keys(filtro).length ? filtro : undefined;
}

// Quinzena 1 = dias 1 a 15; quinzena 2 = dia 16 ate o ultimo dia do mes
function periodoQuinzena(ano, mes, quinzena) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaInicio = quinzena === 1 ? 1 : 16;
  const diaFim = quinzena === 1 ? 15 : ultimoDia;
  const mm = String(mes).padStart(2, '0');
  return {
    dataInicio: `${ano}-${mm}-${String(diaInicio).padStart(2, '0')}`,
    dataFim: `${ano}-${mm}-${String(diaFim).padStart(2, '0')}`,
  };
}

module.exports = { filtroDataSaida, periodoQuinzena };
