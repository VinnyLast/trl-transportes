const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const { autenticar, somenteAdmin } = require('../middleware/auth');
const { validarCPF, limparNumeros } = require('../utils/validators');
const { limiteLogin } = require('../middleware/rateLimit');

const router = express.Router();

// Login aceita e-mail OU CPF como identificador, junto com a senha
const loginSchema = z
  .object({
    email: z.string().email().optional(),
    cpf: z.string().optional(),
    senha: z.string().min(1),
  })
  .refine((dados) => dados.email || dados.cpf, {
    message: 'Informe o e-mail ou o CPF.',
  });

router.post('/login', limiteLogin, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });
  }

  const { email, cpf, senha } = parsed.data;
  const usuario = email
    ? await prisma.usuario.findUnique({ where: { email } })
    : await prisma.usuario.findUnique({ where: { cpf: limparNumeros(cpf) } });

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Credenciais invalidas.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais invalidas.' });
  }

  const token = jwt.sign(
    { sub: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, papel: usuario.papel },
  });
});

router.get('/me', autenticar, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.sub } });
  if (!usuario) return res.status(404).json({ erro: 'Usuario nao encontrado.' });
  res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, papel: usuario.papel });
});

const criarUsuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  cpf: z.string().refine((v) => !v || validarCPF(v), { message: 'CPF invalido.' }).optional(),
  senha: z.string().min(6),
  papel: z.enum(['ADMINISTRADOR', 'OPERADOR']).default('OPERADOR'),
});

// Criacao de usuarios: somente administradores autenticados podem criar novos usuarios
router.post('/usuarios', autenticar, somenteAdmin, async (req, res) => {
  const parsed = criarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados invalidos.', detalhes: parsed.error.flatten() });
  }

  const { nome, email, senha, papel } = parsed.data;
  const cpf = parsed.data.cpf ? limparNumeros(parsed.data.cpf) : null;

  const existenteEmail = await prisma.usuario.findUnique({ where: { email } });
  if (existenteEmail) return res.status(409).json({ erro: 'Ja existe um usuario com este e-mail.' });

  if (cpf) {
    const existenteCpf = await prisma.usuario.findUnique({ where: { cpf } });
    if (existenteCpf) return res.status(409).json({ erro: 'Ja existe um usuario com este CPF.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, cpf, senhaHash, papel },
  });

  res.status(201).json({ id: usuario.id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf, papel: usuario.papel });
});

module.exports = router;
