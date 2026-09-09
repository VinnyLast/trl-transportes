// Trata erros do Prisma ao excluir um registro, distinguindo "nao encontrado"
// de "nao pode excluir porque tem rotas vinculadas" (violacao de chave estrangeira)
function tratarErroExclusao(err, res, nomeEntidade) {
  if (err.code === 'P2025') {
    return res.status(404).json({ erro: `${nomeEntidade} nao encontrado.` });
  }
  if (err.code === 'P2003' || err.code === 'P2014') {
    return res.status(409).json({
      erro: `Nao e possivel excluir: existem rotas vinculadas a este ${nomeEntidade.toLowerCase()}. Desative-o em vez de excluir.`,
    });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno no servidor.' });
}

module.exports = { tratarErroExclusao };
