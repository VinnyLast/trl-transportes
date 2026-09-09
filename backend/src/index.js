require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const motoristasRoutes = require('./routes/motoristas');
const veiculosRoutes = require('./routes/veiculos');
const clientesRoutes = require('./routes/clientes');
const rotasRoutes = require('./routes/rotas');
const motoristaAppRoutes = require('./routes/motoristaApp');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/motoristas', motoristasRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/rotas', rotasRoutes);
app.use('/api/motorista-app', motoristaAppRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota de API nao encontrada.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TRL TRANSPORTES API rodando na porta ${PORT}`);
});
