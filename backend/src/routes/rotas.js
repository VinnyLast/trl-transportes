const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');

const router = express.Router();
router.use(autenticar);

const rotaSchema = z.object({
  motoristaId: z.string().uuid(),
  veiculoId: z.string().uuid(),
  clienteId: z.string().uuid().optional().nullable(),
  origem: z.string().min(1),
  destino: z.string().min(1),
  dataSaida: z.coerce.date(),
  dataChegada: z.coerce.date().optional().nullable(),
  valor: z.coerce.number().nonnegative(),
  observacoes: z.string().optional().nullable(),
  status: z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
});

const include = {
  motorista: { select: { id: true, nome: true } },
  veiculo: { select: { id: true, placa: true, modelo: true } },
  cliente: { select: { id: true, nome: true } },
};

router.get('/', async (req, res) => {
  const { status, motoristaId, veiculoId, dataInicio, dataFim } = req.query;

  const where = {
    status: status || undefined,
    motoristaId: motoristaId || undefined,
    veiculoId: veiculoId || undefined,
  };

  if (dataInicio || dataFim) {
    where.dataSaida = {};
    if (dataInicio) where.dataSaida.gte = new Date(String(dataInicio));
    if (dataFim) where.dataSaida.lte = new Date(String(dataFim));
  }

  const rotas = await prisma.rota.findMany({
    where,
    include,
    orderBy: { dataSaida: 'desc' },
  });
  res.json(rotas);
});

router.get('/resumo', async (req, res) => {
  const { dataInicio, dataFim } = req.query;
  const where = {};
  if (dataInicio || dataFim) {
    where.dataSaida = {};
    if (dataInicio) where.dataSaida.gte = new Date(String(dataInicio));
    if (dataFim) where.dataSaida.lte = new Date(String(dataFim));
  }

  const [total, emAndamento, concluidas, agendadas, canceladas, todas] = await Promise.all([
    prisma.rota.count({ where }),
    prisma.rota.count({ where: { ...where, status: 'EM_ANDAMENTO' } }),
    prisma.rota.count({ where: { ...where, status: 'CONCLUIDA' } }),
    prisma.rota.count({ where: { ...where, status: 'AGENDADA' } }),
    prisma.rota.count({ where: { ...where, status: 'CANCELADA' } }),
    prisma.rota.findMany({ where, select: { valor: true, status: true } }),
  ]);

  const valorTotal = todas
    .filter((r) => r.status !== 'CANCELADA')
    .reduce((soma, r) => soma + Number(r.valor), 0);

  res.json({ total, emAndamento, concluidas, agendadas, canceladas, valorTotal });
});

router.get('/:id', async (req, res) => {
  const rota = await prisma.rota.findUnique({ where: { id: req.params.id }, include });
  if (!rota) return res.status(404).json({ erro: 'Rota nao encontrada.' });
  res.json(rota);
});

router.post('/', async (req, res) => {
  const parsed = rotaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const rota = await prisma.rota.create({ data: parsed.data, include });
  res.status(201).json(rota);
});

router.put('/:id', async (req, res) => {
  const parsed = rotaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  try {
    const rota = await prisma.rota.update({ where: { id: req.params.id }, data: parsed.data, include });
    res.json(rota);
  } catch (err) {
    res.status(404).json({ erro: 'Rota nao encontrada.' });
  }
});

// Finaliza a rota: marca como concluida e registra a chegada no momento atual (ou informado)
router.post('/:id/finalizar', async (req, res) => {
  const dataChegada = req.body?.dataChegada ? new Date(req.body.dataChegada) : new Date();
  try {
    const rota = await prisma.rota.update({
      where: { id: req.params.id },
      data: { status: 'CONCLUIDA', dataChegada },
      include,
    });
    res.json(rota);
  } catch (err) {
    res.status(404).json({ erro: 'Rota nao encontrada.' });
  }
});

router.post('/:id/cancelar', async (req, res) => {
  try {
    const rota = await prisma.rota.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADA' },
      include,
    });
    res.json(rota);
  } catch (err) {
    res.status(404).json({ erro: 'Rota nao encontrada.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.rota.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ erro: 'Rota nao encontrada.' });
  }
});

module.exports = router;
