const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticarMotorista } = require('../middleware/auth');
const { validarCPF, limparNumeros } = require('../utils/validators');
const { limiteLogin } = require('../middleware/rateLimit');
const { uploadRomaneio } = require('../lib/uploads');

const router = express.Router();

// App do motorista: login com CPF + senha (definida pelo administrador no
// cadastro), e depois so as acoes de iniciar/finalizar rota, protegidas por
// um token JWT proprio (tipo "motorista"), separado do login administrativo.
// O motorista so pode usar veiculos ja cadastrados pelo administrador (nao
// cadastra veiculo novo pelo app), e precisa enviar uma foto do romaneio
// para iniciar a rota - fica registrada para o administrador conferir depois.

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

// Lista os destinos ja cadastrados em Trajetos Fixos: o motorista so pode
// escolher entre eles (nao digita destino livre), evitando erro de digitacao
// que faria o valor automatico nao ser reconhecido.
router.get('/destinos-fixos', async (req, res) => {
  const trajetos = await prisma.trajetoFixo.findMany({
    where: { status: 'ATIVO' },
    select: { destino: true },
    orderBy: { destino: 'asc' },
  });
  res.json(trajetos.map((t) => t.destino));
});

const iniciarSchema = z.object({
  veiculoId: z.string().uuid({ message: 'Selecione um veiculo cadastrado.' }),
  origem: z.string().min(1, 'Informe a origem.'),
  destino: z.string().min(1, 'Informe o destino.'),
});

function receberFotoRomaneio(req, res, next) {
  uploadRomaneio.single('romaneio')(req, res, (err) => {
    if (err) return res.status(400).json({ erro: err.message || 'Erro ao enviar a foto do romaneio.' });
    next();
  });
}

router.post('/iniciar', receberFotoRomaneio, async (req, res) => {
  const parsed = iniciarSchema.safeParse(req.body);
  if (!parsed.success) {
    const primeiraMensagem = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Dados invalidos.';
    return res.status(400).json({ erro: primeiraMensagem });
  }

  if (!req.file) {
    return res.status(400).json({ erro: 'Envie a foto do romaneio para iniciar a rota.' });
  }

  const rotaAberta = await prisma.rota.findFirst({
    where: { motoristaId: req.motorista.id, status: 'EM_ANDAMENTO' },
  });
  if (rotaAberta) {
    return res.status(409).json({ erro: 'Ja existe uma rota em andamento.' });
  }

  const veiculo = await prisma.veiculo.findUnique({ where: { id: parsed.data.veiculoId } });
  if (!veiculo || veiculo.status !== 'ATIVO') {
    return res.status(404).json({ erro: 'Veiculo nao encontrado ou indisponivel.' });
  }

  const origem = parsed.data.origem.trim();
  const destino = parsed.data.destino.trim();

  // O destino precisa ser um dos trajetos fixos cadastrados (o motorista so
  // pode escolher entre eles no app) - valida de novo aqui no servidor para
  // nao depender so do frontend.
  const trajetoFixo = await prisma.trajetoFixo.findFirst({
    where: {
      status: 'ATIVO',
      origem: { equals: origem, mode: 'insensitive' },
      destino: { equals: destino, mode: 'insensitive' },
    },
  });

  if (!trajetoFixo) {
    return res.status(400).json({ erro: 'Destino invalido. Selecione um destino da lista.' });
  }

  const camposPorTipo = {
    TOCO: 'valorToco',
    TRES_QUARTOS: 'valorTresQuartos',
    VAN: 'valorVan',
    TRUCK: 'valorTruck',
  };
  const campoValor = camposPorTipo[veiculo.tipo];
  const valorFixoParaTipo = trajetoFixo && campoValor ? trajetoFixo[campoValor] : null;

  const valor = valorFixoParaTipo !== null && valorFixoParaTipo !== undefined
    ? Number(valorFixoParaTipo)
    : Number(process.env.VALOR_ROTA_PADRAO || 0);

  const rota = await prisma.rota.create({
    data: {
      motoristaId: req.motorista.id,
      veiculoId: veiculo.id,
      origem,
      destino,
      dataSaida: new Date(),
      valor,
      fotoRomaneio: req.file.filename,
      status: 'EM_ANDAMENTO',
    },
    include: includeResumo,
  });

  res.status(201).json({ motorista: req.motorista, rota, trajetoFixo: valorFixoParaTipo !== null && valorFixoParaTipo !== undefined });
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
