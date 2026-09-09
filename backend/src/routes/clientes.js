const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');
const { tratarErroExclusao } = require('../utils/erros');

const router = express.Router();
router.use(autenticar);

const clienteSchema = z.object({
  nome: z.string().min(2),
  endereco: z.string().min(3),
  contato: z.string().optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
});

router.get('/', async (req, res) => {
  const { busca, status } = req.query;
  const clientes = await prisma.cliente.findMany({
    where: {
      status: status || undefined,
      nome: busca ? { contains: String(busca), mode: 'insensitive' } : undefined,
    },
    orderBy: { nome: 'asc' },
  });
  res.json(clientes);
});

router.get('/:id', async (req, res) => {
  const cliente = await prisma.cliente.findUnique({ where: { id: req.params.id } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente nao encontrado.' });
  res.json(cliente);
});

router.post('/', async (req, res) => {
  const parsed = clienteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });
  const cliente = await prisma.cliente.create({ data: parsed.data });
  res.status(201).json(cliente);
});

router.put('/:id', async (req, res) => {
  const parsed = clienteSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });
  try {
    const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(cliente);
  } catch (err) {
    tratarErroExclusao(err, res, 'Cliente');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    tratarErroExclusao(err, res, 'Cliente');
  }
});

module.exports = router;
