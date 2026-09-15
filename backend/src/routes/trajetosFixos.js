const express = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar } = require('../middleware/auth');
const { tratarErroExclusao } = require('../utils/erros');

const router = express.Router();
router.use(autenticar);

// Aceita numero, string vazia ou nulo (campo opcional); string vazia/nulo vira null
const valorOpcional = z
  .union([z.coerce.number().nonnegative(), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === '' || v === undefined || v === null ? null : v));

const trajetoSchema = z
  .object({
    origem: z.string().min(1),
    destino: z.string().min(1),
    valorToco: valorOpcional,
    valorTresQuartos: valorOpcional,
    valorVan: valorOpcional,
    valorTruck: valorOpcional,
    status: z.enum(['ATIVO', 'INATIVO']).optional(),
  })
  .refine(
    (dados) => {
      const valores = [dados.valorToco, dados.valorTresQuartos, dados.valorVan, dados.valorTruck];
      const algumInformado = valores.some((v) => v !== null && v !== undefined);
      const nenhumEnviado = valores.every((v) => v === undefined);
      return algumInformado || nenhumEnviado;
    },
    { message: 'Informe pelo menos um valor (Toco, 3/4, Van ou Truck).', path: ['valorToco'] }
  );

router.get('/', async (req, res) => {
  const { status, busca } = req.query;
  const trajetos = await prisma.trajetoFixo.findMany({
    where: {
      status: status || undefined,
      OR: busca
        ? [
            { origem: { contains: String(busca), mode: 'insensitive' } },
            { destino: { contains: String(busca), mode: 'insensitive' } },
          ]
        : undefined,
    },
    orderBy: [{ origem: 'asc' }, { destino: 'asc' }],
  });
  res.json(trajetos);
});

router.get('/:id', async (req, res) => {
  const trajeto = await prisma.trajetoFixo.findUnique({ where: { id: req.params.id } });
  if (!trajeto) return res.status(404).json({ erro: 'Trajeto fixo nao encontrado.' });
  res.json(trajeto);
});

router.post('/', async (req, res) => {
  const parsed = trajetoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data, origem: parsed.data.origem.trim(), destino: parsed.data.destino.trim() };

  const existente = await prisma.trajetoFixo.findFirst({
    where: { origem: { equals: dados.origem, mode: 'insensitive' }, destino: { equals: dados.destino, mode: 'insensitive' } },
  });
  if (existente) return res.status(409).json({ erro: 'Ja existe um trajeto fixo com esta origem e destino.' });

  const trajeto = await prisma.trajetoFixo.create({ data: dados });
  res.status(201).json(trajeto);
});

router.put('/:id', async (req, res) => {
  const parsed = trajetoSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });

  const dados = { ...parsed.data };
  if (dados.origem) dados.origem = dados.origem.trim();
  if (dados.destino) dados.destino = dados.destino.trim();

  try {
    const trajeto = await prisma.trajetoFixo.update({ where: { id: req.params.id }, data: dados });
    res.json(trajeto);
  } catch (err) {
    tratarErroExclusao(err, res, 'Trajeto fixo');
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.trajetoFixo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    tratarErroExclusao(err, res, 'Trajeto fixo');
  }
});

module.exports = router;
