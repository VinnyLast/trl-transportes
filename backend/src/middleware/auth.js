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

module.exports = { autenticar, somenteAdmin };
