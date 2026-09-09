const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token de autenticacao ausente.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }
}

function somenteAdmin(req, res, next) {
  if (req.usuario?.papel !== 'ADMINISTRADOR') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

// Autenticacao do aplicativo do motorista: token JWT separado (tipo "motorista"),
// mais restrito que o token administrativo (so acessa as rotas do proprio motorista)
function autenticarMotorista(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Token de autenticacao ausente.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'motorista') {
      return res.status(401).json({ erro: 'Token invalido para esta area.' });
    }
    req.motorista = { id: payload.sub, nome: payload.nome };
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }
}

module.exports = { autenticar, somenteAdmin, autenticarMotorista };
