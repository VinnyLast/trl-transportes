const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');
const { validarCPF, limparNumeros } = require('../utils/validators');

const router = express.Router();
router.use(autenticar);

const motoristaSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().refine(validarCPF, { message: 'CPF invalido.' }),
  cnhNumero: z.string().min(1),
  cnhCategoria: z.string().min(1),
  telefone: z.string().min(8),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
});

router.get('/', async (req, res) => {
  const { status, busca } = req.query;
  const motoristas = await prisma.motorista.findMany({
    where: {
      status: status || undefined,
      nome: busca ? { contains: String(busca), mode: 'insensitive' } : undefined,
    },
    orderBy: { nome: 'asc' },
  });
  res.json(motoristas);
});

router.get('/:id', async (req, res) => {
  const motorista = await prisma.motorista.findUnique({ where: { id: req.params.id } });
  if (!motorista) return res.status(404).json({ erro: 'Motorista nao encontrado.' });
  res.json(motorista);
});

router.post('/', async (req, res) => {
  const parsed = motoristaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data, cpf: limparNumeros(parsed.data.cpf) };

  const existente = await prisma.motorista.findUnique({ where: { cpf: dados.cpf } });
  if (existente) return res.status(409).json({ erro: 'Ja existe um motorista com este CPF.' });

  const motorista = await prisma.motorista.create({ data: dados });
  res.status(201).json(motorista);
});

router.put('/:id', async (req, res) => {
  const parsed = motoristaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data };
  if (dados.cpf) dados.cpf = limparNumeros(dados.cpf);

  try {
    const motorista = await prisma.motorista.update({ where: { id: req.params.id }, data: dados });
    res.json(motorista);
  } catch (err) {
    res.status(404).json({ erro: 'Motorista nao encontrado.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.motorista.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ erro: 'Motorista nao encontrado.' });
  }
});

module.exports = router;
