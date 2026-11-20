const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

function lerToken(req) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

function verificarToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// O token dura 30 dias, entao a cada requisicao o usuario e conferido no
// banco: desativar alguem (ou mudar o papel) vale na hora, nao so quando o
// token expirar.
async function autenticar(req, res, next) {
  const token = lerToken(req);
  if (!token) return res.status(401).json({ erro: 'Token de autenticacao ausente.' });

  const payload = verificarToken(token);
  if (!payload || payload.tipo === 'motorista') {
    return res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, nome: true, email: true, papel: true, ativo: true },
  });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Acesso desativado.' });
  }

  req.usuario = { sub: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
  next();
}

function somenteAdmin(req, res, next) {
  if (req.usuario?.papel !== 'ADMINISTRADOR') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

// App do motorista: token proprio (tipo "motorista"); motorista desativado
// ou sem senha de acesso perde o acesso imediatamente.
async function autenticarMotorista(req, res, next) {
  const token = lerToken(req);
  if (!token) return res.status(401).json({ erro: 'Token de autenticacao ausente.' });

  const payload = verificarToken(token);
  if (!payload || payload.tipo !== 'motorista') {
    return res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }

  const motorista = await prisma.motorista.findUnique({
    where: { id: payload.sub },
    select: { id: true, nome: true, status: true, senhaHash: true },
  });
  if (!motorista || motorista.status !== 'ATIVO' || !motorista.senhaHash) {
    return res.status(401).json({ erro: 'Acesso desativado. Fale com o administrador.' });
  }

  req.motorista = { id: motorista.id, nome: motorista.nome };
  next();
}

module.exports = { autenticar, somenteAdmin, autenticarMotorista };
