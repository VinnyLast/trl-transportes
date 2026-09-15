// Correcao pontual: o script seedTrajetosFixos.js original separou por engano
// linhas da planilha que na verdade representam UMA rota so, passando por
// varios pontos, com um unico valor final. Este script desfaz essa separacao:
// apaga as entradas separadas incorretamente e cria as entradas combinadas,
// exatamente como na planilha original. Nao mexe em nenhuma outra entrada.
//
// Seguro para rodar mais de uma vez.
//
// Uso: node prisma/fixTrajetosFixosCombinados.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORIGEM = 'FEC-BA';

// Destinos que foram separados por engano e devem ser removidos (cada um
// tinha sido criado como uma linha propria, com o mesmo preco compartilhado)
const destinosParaRemover = [
  'F CAP-BA',
  'JAC-BA',
  'F PAV-BA',
  'DEL AL',
  'RBP-BA',
  'EUC-BA 02',
  'FSAJ02-BA',
  'FSAJ-BA',
  'SAJ-BA',
  'F JUA-BA',
  'F JUA 02-BA',
  'F CRC-BA',
  'F SBM-BA',
  'F CZM-BA',
  'FSPU-BA',
  'F VAL-BA',
  'F CMM-BA',
];

// Entradas combinadas corretas, exatamente como na planilha original
const trajetosCombinados = [
  { destino: 'F CAP-BA - JAC-BA', valorToco: null, valorTresQuartos: 1100 },
  { destino: 'F PAV-BA - DEL AL', valorToco: null, valorTresQuartos: 2000 },
  { destino: 'RBP-BA - EUC-BA 02', valorToco: 1800, valorTresQuartos: 1400 },
  { destino: 'FSAJ02-BA - FSAJ-BA - SAJ-BA', valorToco: null, valorTresQuartos: 1150 },
  { destino: 'F JUA-BA - F JUA 02-BA - F CRC-BA - F SBM-BA', valorToco: 2200, valorTresQuartos: 2000 },
  { destino: 'F CZM-BA - FSPU-BA - F VAL-BA - F CMM-BA', valorToco: 1400, valorTresQuartos: 1000 },
];

async function main() {
  const removidos = await prisma.trajetoFixo.deleteMany({
    where: { origem: ORIGEM, destino: { in: destinosParaRemover } },
  });
  console.log(`Removidas ${removidos.count} entradas separadas incorretamente.`);

  for (const t of trajetosCombinados) {
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
    console.log('OK (combinado):', t.destino);
  }

  console.log('\nCorrecao concluida.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
