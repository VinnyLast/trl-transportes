// Cadastra em lote a tabela de trajetos fixos (origem sempre FEC-BA), com
// valor por tipo de veiculo (Toco / 3/4). Usa upsert: seguro para rodar mais
// de uma vez - nunca apaga nada, so cria ou atualiza o que ja existe pela
// combinacao origem+destino.
//
// Uso: node prisma/seedTrajetosFixos.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORIGEM = 'FEC-BA';

// Linhas da tabela original que continham mais de um codigo de destino
// compartilhando o mesmo preco foram separadas em uma entrada por codigo,
// para que o sistema reconheca cada destino individualmente.
const trajetos = [
  { destino: 'DC SBA-BA', valorToco: 2200, valorTresQuartos: 1600 },

  // Linha original: "F CAP -BA -  JAC -BA" (so valor 3/4)
  { destino: 'F CAP-BA', valorToco: null, valorTresQuartos: 1100 },
  { destino: 'JAC-BA', valorToco: null, valorTresQuartos: 1100 },

  // Linha original: "F PAV-BA - DEL AL" (so valor 3/4)
  { destino: 'F PAV-BA', valorToco: null, valorTresQuartos: 2000 },
  { destino: 'DEL AL', valorToco: null, valorTresQuartos: 2000 },

  // Linha original: "RBP-BA - EUC -BA 02"
  { destino: 'RBP-BA', valorToco: 1800, valorTresQuartos: 1400 },
  { destino: 'EUC-BA 02', valorToco: 1800, valorTresQuartos: 1400 },

  // Linha original: "FSAJ02-BA-FSAJ-BA-SAJ -BA" (so valor 3/4)
  { destino: 'FSAJ02-BA', valorToco: null, valorTresQuartos: 1150 },
  { destino: 'FSAJ-BA', valorToco: null, valorTresQuartos: 1150 },
  { destino: 'SAJ-BA', valorToco: null, valorTresQuartos: 1150 },

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

  // Linha original: "F- JUA -BA - F JUA 02 -BA - F CRC -BA - F -SBM -BA"
  { destino: 'F JUA-BA', valorToco: 2200, valorTresQuartos: 2000 },
  { destino: 'F JUA 02-BA', valorToco: 2200, valorTresQuartos: 2000 },
  { destino: 'F CRC-BA', valorToco: 2200, valorTresQuartos: 2000 },
  { destino: 'F SBM-BA', valorToco: 2200, valorTresQuartos: 2000 },

  // Linha original: "F CZM -BA - FSPU-BA-F VAL -BA - F CMM -BA"
  { destino: 'F CZM-BA', valorToco: 1400, valorTresQuartos: 1000 },
  { destino: 'FSPU-BA', valorToco: 1400, valorTresQuartos: 1000 },
  { destino: 'F VAL-BA', valorToco: 1400, valorTresQuartos: 1000 },
  { destino: 'F CMM-BA', valorToco: 1400, valorTresQuartos: 1000 },

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
