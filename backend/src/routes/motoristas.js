const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');
const { validarCPF, limparNumeros } = require('../utils/validators');
const { tratarErroExclusao } = require('../utils/erros');

const router = express.Router();
router.use(autenticar);

function selecionarCampos() {
  return {
    id: true,
    nome: true,
    cpf: true,
    cnhNumero: true,
    cnhCategoria: true,
    telefone: true,
    status: true,
    criadoEm: true,
    atualizadoEm: true,
  };
}

// Retorna o motorista sem o hash da senha, com um indicador booleano "temSenha"
// para a interface saber se o acesso ao aplicativo ja foi habilitado
function comIndicadorSenha(motorista) {
  if (!motorista) return motorista;
  const { senhaHash, ...resto } = motorista;
  return { ...resto, temSenha: Boolean(senhaHash) };
}

const motoristaSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().refine(validarCPF, { message: 'CPF invalido.' }),
  cnhNumero: z.string().min(1),
  cnhCategoria: z.string().min(1),
  telefone: z.string().min(8),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
  senha: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres.').optional().or(z.literal('')),
});

router.get('/', async (req, res) => {
  const { status, busca } = req.query;
  const motoristas = await prisma.motorista.findMany({
    where: {
      status: status || undefined,
      nome: busca ? { contains: String(busca), mode: 'insensitive' } : undefined,
    },
    select: { ...selecionarCampos(), senhaHash: true },
    orderBy: { nome: 'asc' },
  });
  res.json(motoristas.map(comIndicadorSenha));
});

router.get('/:id', async (req, res) => {
  const motorista = await prisma.motorista.findUnique({
    where: { id: req.params.id },
    select: { ...selecionarCampos(), senhaHash: true },
  });
  if (!motorista) return res.status(404).json({ erro: 'Motorista nao encontrado.' });
  res.json(comIndicadorSenha(motorista));
});

router.post('/', async (req, res) => {
  const parsed = motoristaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const { senha, ...resto } = parsed.data;
  const dados = { ...resto, cpf: limparNumeros(parsed.data.cpf) };

  const existente = await prisma.motorista.findUnique({ where: { cpf: dados.cpf } });
  if (existente) return res.status(409).json({ erro: 'Ja existe um motorista com este CPF.' });

  if (senha) {
    dados.senhaHash = await bcrypt.hash(senha, 10);
  }

  const motorista = await prisma.motorista.create({
    data: dados,
    select: { ...selecionarCampos(), senhaHash: true },
  });
  res.status(201).json(comIndicadorSenha(motorista));
});

router.put('/:id', async (req, res) => {
  const parsed = motoristaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const { senha, ...resto } = parsed.data;
  const dados = { ...resto };
  if (dados.cpf) dados.cpf = limparNumeros(dados.cpf);
  if (senha) {
    dados.senhaHash = await bcrypt.hash(senha, 10);
  }

  try {
    const motorista = await prisma.motorista.update({
      where: { id: req.params.id },
      data: dados,
      select: { ...selecionarCampos(), senhaHash: true },
    });
    res.json(comIndicadorSenha(motorista));
  } catch (err) {
    tratarErroExclusao(err, res, 'Motorista');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.motorista.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    tratarErroExclusao(err, res, 'Motorista');
  }
});

module.exports = router;
