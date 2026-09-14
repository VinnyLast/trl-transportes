const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticarMotorista } = require('../middleware/auth');
const { validarCPF, limparNumeros, validarPlaca, normalizarPlaca } = require('../utils/validators');
const { limiteLogin } = require('../middleware/rateLimit');

const router = express.Router();

// App do motorista: login com CPF + senha (definida pelo administrador no
// cadastro), e depois so as acoes de iniciar/finalizar rota, protegidas por
// um token JWT proprio (tipo "motorista"), separado do login administrativo.

const includeResumo = {
  veiculo: { select: { id: true, placa: true, modelo: true, tipo: true } },
};

const loginSchema = z.object({
  cpf: z.string(),
  senha: z.string().min(1),
});

router.post('/login', limiteLogin, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: 'Informe o CPF e a senha.' });

  const cpf = limparNumeros(parsed.data.cpf);
  if (!validarCPF(cpf)) return res.status(400).json({ erro: 'CPF invalido.' });

  const motorista = await prisma.motorista.findUnique({ where: { cpf } });

  if (!motorista || motorista.status !== 'ATIVO') {
    return res.status(401).json({ erro: 'CPF ou senha invalidos.' });
  }

  if (!motorista.senhaHash) {
    return res.status(401).json({ erro: 'Acesso ao aplicativo ainda nao habilitado. Fale com o administrador.' });
  }

  const senhaValida = await bcrypt.compare(parsed.data.senha, motorista.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'CPF ou senha invalidos.' });
  }

  const token = jwt.sign(
    { sub: motorista.id, nome: motorista.nome, tipo: 'motorista' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );

  res.json({ token, motorista: { id: motorista.id, nome: motorista.nome } });
});

router.use(autenticarMotorista);

router.get('/status', async (req, res) => {
  const rotaAtiva = await prisma.rota.findFirst({
    where: { motoristaId: req.motorista.id, status: 'EM_ANDAMENTO' },
    include: includeResumo,
    orderBy: { dataSaida: 'desc' },
  });

  res.json({ motorista: req.motorista, rotaAtiva });
});

router.get('/veiculos', async (req, res) => {
  const veiculos = await prisma.veiculo.findMany({
    where: { status: 'ATIVO' },
    select: { id: true, placa: true, modelo: true },
    orderBy: { placa: 'asc' },
  });
  res.json(veiculos);
});

const iniciarSchema = z
  .object({
    veiculoId: z.string().uuid().optional(),
    placa: z.string().optional(),
    modelo: z.string().optional(),
    origem: z.string().min(1, 'Informe a origem.'),
    destino: z.string().min(1, 'Informe o destino.'),
  })
  .refine((dados) => dados.veiculoId || dados.placa, {
    message: 'Selecione um veiculo cadastrado ou digite a placa.',
  });

router.post('/iniciar', async (req, res) => {
  const parsed = iniciarSchema.safeParse(req.body);
  if (!parsed.success) {
    const primeiraMensagem = parsed.error.errors[0]?.message || 'Dados invalidos.';
    return res.status(400).json({ erro: primeiraMensagem });
  }

  const rotaAberta = await prisma.rota.findFirst({
    where: { motoristaId: req.motorista.id, status: 'EM_ANDAMENTO' },
  });
  if (rotaAberta) {
    return res.status(409).json({ erro: 'Ja existe uma rota em andamento.' });
  }

  let veiculo;

  if (parsed.data.veiculoId) {
    veiculo = await prisma.veiculo.findUnique({ where: { id: parsed.data.veiculoId } });
    if (!veiculo || veiculo.status !== 'ATIVO') {
      return res.status(404).json({ erro: 'Veiculo nao encontrado ou indisponivel.' });
    }
  } else {
    if (!validarPlaca(parsed.data.placa)) {
      return res.status(400).json({ erro: 'Placa invalida. Use o formato ABC1234 ou ABC1D23.' });
    }
    const placa = normalizarPlaca(parsed.data.placa);
    veiculo = await prisma.veiculo.findUnique({ where: { placa } });

    if (veiculo && veiculo.status !== 'ATIVO') {
      return res.status(409).json({ erro: `Este veiculo esta com status "${veiculo.status}". Fale com o administrador.` });
    }

    if (!veiculo) {
      // Veiculo ainda nao cadastrado: cria automaticamente a partir do que o motorista informou
      veiculo = await prisma.veiculo.create({
        data: { placa, modelo: parsed.data.modelo?.trim() || 'Nao informado', status: 'ATIVO' },
      });
    }
  }

  const origem = parsed.data.origem.trim();
  const destino = parsed.data.destino.trim();

  // Se origem/destino batem com um trajeto fixo cadastrado, usa o valor dele
  // de acordo com o tipo do veiculo (Toco/3-4 tem precos diferentes). Se nao
  // houver valor definido para esse tipo especifico, usa o valor padrao
  // (rota nao fixa, com valor livre).
  const trajetoFixo = await prisma.trajetoFixo.findFirst({
    where: {
      status: 'ATIVO',
      origem: { equals: origem, mode: 'insensitive' },
      destino: { equals: destino, mode: 'insensitive' },
    },
  });

  const valorFixoParaTipo = trajetoFixo
    ? veiculo.tipo === 'TOCO'
      ? trajetoFixo.valorToco
      : veiculo.tipo === 'TRES_QUARTOS'
        ? trajetoFixo.valorTresQuartos
        : null
    : null;

  const valor = valorFixoParaTipo !== null ? Number(valorFixoParaTipo) : Number(process.env.VALOR_ROTA_PADRAO || 0);

  const rota = await prisma.rota.create({
    data: {
      motoristaId: req.motorista.id,
      veiculoId: veiculo.id,
      origem,
      destino,
      dataSaida: new Date(),
      valor,
      status: 'EM_ANDAMENTO',
    },
    include: includeResumo,
  });

  res.status(201).json({ motorista: req.motorista, rota, trajetoFixo: valorFixoParaTipo !== null });
});

router.post('/finalizar', async (req, res) => {
  const rotaAberta = await prisma.rota.findFirst({
    where: { motoristaId: req.motorista.id, status: 'EM_ANDAMENTO' },
    orderBy: { dataSaida: 'desc' },
  });

  if (!rotaAberta) {
    return res.status(404).json({ erro: 'Nao ha rota em andamento.' });
  }

  const rota = await prisma.rota.update({
    where: { id: rotaAberta.id },
    data: { status: 'CONCLUIDA', dataChegada: new Date() },
    include: includeResumo,
  });

  res.json({ motorista: req.motorista, rota });
});

module.exports = router;
