const rateLimit = require('express-rate-limit');

// Limite geral para toda a API: evita abuso/varredura sem incomodar uso normal
const limiteGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisicoes. Tente novamente em alguns minutos.' },
});

// Limite estrito para rotas de login (administrativo e do motorista): dificulta
// tentativas de forca bruta de senha, ja que CPF nao e um dado secreto
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.' },
});

module.exports = { limiteGeral, limiteLogin };
