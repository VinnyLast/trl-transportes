const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@trltransportes.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@trltransportes.com.br',
      senhaHash,
      papel: 'ADMINISTRADOR',
    },
  });

  console.log('Usuario administrador criado/existente:', admin.email);
  console.log('Senha padrao: admin123 (altere apos o primeiro login)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
