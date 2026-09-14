// Cadastra os administradores da TRL TRANSPORTES. Idempotente (upsert por
// e-mail): seguro para rodar mais de uma vez, nunca apaga nada.
//
// Uso: node prisma/seedAdmins.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SENHA_PADRAO = 'trl123';

const administradores = [
  { nome: 'Luan', email: 'luan_plin@hotmail.com' },
  { nome: 'Joao Vitor Alves Ramos', email: 'joaovitoralvesramos@hotmail.com' },
  { nome: 'Wesley', email: 'wesley_fsa12@hotmail.com' },
];

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  for (const admin of administradores) {
    await prisma.usuario.upsert({
      where: { email: admin.email },
      update: { nome: admin.nome, papel: 'ADMINISTRADOR', ativo: true },
      create: {
        nome: admin.nome,
        email: admin.email,
        senhaHash,
        papel: 'ADMINISTRADOR',
      },
    });
    console.log('OK:', admin.email);
  }

  console.log(`\n${administradores.length} administradores cadastrados/atualizados.`);
  console.log(`Senha inicial de todos: ${SENHA_PADRAO} (recomendado trocar depois do primeiro login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
