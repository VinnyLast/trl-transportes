const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');
const { validarPlaca, normalizarPlaca } = require('../utils/validators');

const router = express.Router();
router.use(autenticar);

const veiculoSchema = z.object({
  placa: z.string().refine(validarPlaca, { message: 'Placa invalida. Use o formato ABC1234 ou ABC1D23.' }),
  modelo: z.string().min(1),
  capacidadeCarga: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'MANUTENCAO', 'INATIVO']).optional(),
});

router.get('/', async (req, res) => {
  const { status, busca } = req.query;
  const veiculos = await prisma.veiculo.findMany({
    where: {
      status: status || undefined,
      OR: busca
        ? [
            { placa: { contains: String(busca), mode: 'insensitive' } },
            { modelo: { contains: String(busca), mode: 'insensitive' } },
          ]
        : undefined,
    },
    orderBy: { placa: 'asc' },
  });
  res.json(veiculos);
});

router.get('/:id', async (req, res) => {
  const veiculo = await prisma.veiculo.findUnique({ where: { id: req.params.id } });
  if (!veiculo) return res.status(404).json({ erro: 'Veiculo nao encontrado.' });
  res.json(veiculo);
});

router.post('/', async (req, res) => {
  const parsed = veiculoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data, placa: normalizarPlaca(parsed.data.placa) };

  const existente = await prisma.veiculo.findUnique({ where: { placa: dados.placa } });
  if (existente) return res.status(409).json({ erro: 'Ja existe um veiculo com esta placa.' });

  const veiculo = await prisma.veiculo.create({ data: dados });
  res.status(201).json(veiculo);
});

router.put('/:id', async (req, res) => {
  const parsed = veiculoSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data };
  if (dados.placa) dados.placa = normalizarPlaca(dados.placa);

  try {
    const veiculo = await prisma.veiculo.update({ where: { id: req.params.id }, data: dados });
    res.json(veiculo);
  } catch (err) {
    res.status(404).json({ erro: 'Veiculo nao encontrado.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.veiculo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ erro: 'Veiculo nao encontrado.' });
  }
});

module.exports = router;
