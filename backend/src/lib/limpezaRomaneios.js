const fs = require('fs/promises');
const path = require('path');
const prisma = require('./prisma');
const { PASTA_ROMANEIOS } = require('./uploads');

// Fotos de romaneio ficam guardadas por este tempo (contado a partir do
// inicio da rota) e depois sao apagadas do disco; a rota em si continua.
const DIAS_RETENCAO = 60;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

async function limparRomaneiosAntigos() {
  const limite = new Date(Date.now() - DIAS_RETENCAO * UM_DIA_MS);

  const rotas = await prisma.rota.findMany({
    where: { fotoRomaneio: { not: null }, dataSaida: { lt: limite } },
    select: { id: true, fotoRomaneio: true },
  });

  for (const rota of rotas) {
    await fs.unlink(path.join(PASTA_ROMANEIOS, rota.fotoRomaneio)).catch(() => {});
    await prisma.rota.update({ where: { id: rota.id }, data: { fotoRomaneio: null } });
  }

  if (rotas.length) {
    console.log(`[limpeza] ${rotas.length} foto(s) de romaneio com mais de ${DIAS_RETENCAO} dias removida(s).`);
  }
}

function agendarLimpezaRomaneios() {
  const executar = () =>
    limparRomaneiosAntigos().catch((err) => console.error('[limpeza] Falha ao limpar romaneios:', err));

  executar();
  setInterval(executar, UM_DIA_MS);
}

module.exports = { agendarLimpezaRomaneios, DIAS_RETENCAO };
