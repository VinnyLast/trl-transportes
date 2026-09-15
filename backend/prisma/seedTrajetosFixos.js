// Cadastra em lote a tabela de trajetos fixos (origem sempre FEC-BA), com
// valor por tipo de veiculo. Usa upsert: seguro para rodar mais de uma vez -
// nunca apaga nada, so cria ou atualiza o que ja existe pela combinacao
// origem+destino.
//
// Uso: node prisma/seedTrajetosFixos.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORIGEM = 'FEC-BA';

// Algumas linhas da tabela original representam uma unica rota que passa por
// varios pontos, com um valor final combinado (ex.: "F JUA -BA - F JUA 02
// -BA - F CRC -BA - F -SBM -BA") — mantidas exatamente como uma so entrada,
// igual na planilha.
const trajetos = [
  { destino: 'DC SBA-BA', valorToco: 2200, valorTresQuartos: 1600 },
  { destino: 'F CAP-BA - JAC-BA', valorToco: null, valorTresQuartos: 1100 },
  { destino: 'F PAV-BA - DEL AL', valorToco: null, valorTresQuartos: 2000 },
  { destino: 'RBP-BA - EUC-BA 02', valorToco: 1800, valorTresQuartos: 1400 },
  { destino: 'FSAJ02-BA - FSAJ-BA - SAJ-BA', valorToco: null, valorTresQuartos: 1150 },
  { destino: 'SSA-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'POLI-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'CAM-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'DDA-BA 02', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'LOB-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'CAJ-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'SSA 02-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'SIN-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'CANA-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'SUSU-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'SSA 03-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'PER-BA', valorToco: 1000, valorTresQuartos: 710 },

  // Linha original: "ALG - 02 -BA -ESP -BA" (texto ambiguo, mantido inteiro - confira!)
  { destino: 'ALG-02-BA-ESP-BA', valorToco: 1000, valorTresQuartos: null },

  { destino: 'ITAP-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'SFO-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'BRO-BA', valorToco: 1000, valorTresQuartos: 710 },
  { destino: 'F JUA-BA - F JUA 02-BA - F CRC-BA - F SBM-BA', valorToco: 2200, valorTresQuartos: 2000 },
  { destino: 'F CZM-BA - FSPU-BA - F VAL-BA - F CMM-BA', valorToco: 1400, valorTresQuartos: 1000 },
  { destino: 'FLDF-BA', valorToco: null, valorTresQuartos: 710 },
];

async function main() {
  for (const t of trajetos) {
    await prisma.trajetoFixo.upsert({
      where: { origem_destino: { origem: ORIGEM, destino: t.destino } },
      update: { valorToco: t.valorToco, valorTresQuartos: t.valorTresQuartos, status: 'ATIVO' },
      create: {
        origem: ORIGEM,
        destino: t.destino,
        valorToco: t.valorToco,
        valorTresQuartos: t.valorTresQuartos,
        status: 'ATIVO',
      },
    });
    console.log('OK:', t.destino);
  }
  console.log(`\n${trajetos.length} trajetos fixos cadastrados/atualizados com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
