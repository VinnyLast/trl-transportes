# TRL TRANSPORTES

Aplicativo web (PWA) para controle interno de rotas de entrega de caminhoes: cadastro de motoristas, veiculos e clientes, registro de saida/chegada de cada rota e um valor fixo de pagamento por rota, alem de um painel com indicadores e exportacao de relatorios.

Este sistema serve apenas para controle operacional interno. Nao e um sistema financeiro/contabil completo.

## Stack

- **Frontend**: React + Vite, PWA (instalavel, com manifest e service worker), `lucide-react` para icones, `react-router-dom`, `axios`.
- **Backend**: Node.js + Express (API REST), autenticacao com JWT.
- **Banco de dados**: PostgreSQL, com Prisma ORM.
- **Deploy**: Docker + docker-compose, exemplo de configuracao de Nginx como proxy reverso com HTTPS (Certbot).

## Estrutura do projeto

```
TRL TRANSPORTES/
├─ backend/            API Express + Prisma
│  ├─ prisma/          schema.prisma e migrations
│  └─ src/
│     ├─ routes/        auth, motoristas, veiculos, clientes, rotas
│     ├─ middleware/     autenticacao JWT
│     └─ lib/            client Prisma
├─ frontend/           React + Vite (PWA)
│  └─ src/
│     ├─ pages/          Login, Dashboard, Motoristas, Veiculos, Clientes, Rotas
│     ├─ components/     Layout (menu lateral, topo)
│     └─ context/        AuthContext (login/logout)
├─ nginx/              exemplo de configuracao de proxy reverso para producao
└─ docker-compose.yml  orquestra banco + backend + frontend
```

## Rodando localmente (sem Docker)

Pre-requisitos: Node.js 20+, PostgreSQL 16 (local ou remoto).

### 1. Banco de dados

Crie um banco PostgreSQL vazio, por exemplo `trl_transportes`, com um usuario e senha de sua escolha.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edite `.env` e ajuste `DATABASE_URL` para apontar para o seu PostgreSQL, e defina um `JWT_SECRET` forte.

```bash
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

O `npm run seed` cria o usuario administrador padrao:

- **E-mail**: `admin@trltransportes.com.br`
- **Senha**: `admin123`

Altere a senha assim que possivel (crie um novo usuario administrador e desative/edite este, ou gere um novo hash).

A API sobe em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

O frontend sobe em `http://localhost:5173` e ja aponta para a API local (`VITE_API_URL` em `.env`).

## Scripts disponiveis

### Backend (`backend/package.json`)

- `npm run dev` - sobe a API com reload automatico (nodemon)
- `npm start` - sobe a API em modo producao
- `npm run prisma:migrate` - cria/aplica migrations em ambiente de desenvolvimento
- `npm run prisma:deploy` - aplica migrations existentes (usado em producao)
- `npm run prisma:studio` - interface visual do banco
- `npm run seed` - cria o usuario administrador padrao

### Frontend (`frontend/package.json`)

- `npm run dev` - sobe o Vite em modo desenvolvimento
- `npm run build` - gera o build de producao em `dist/`
- `npm run preview` - serve o build de producao localmente

## Principais endpoints da API

Todas as rotas (exceto `/api/auth/login`) exigem o header `Authorization: Bearer <token>`.

| Metodo | Rota | Descricao |
|---|---|---|
| POST | `/api/auth/login` | Autentica e retorna token JWT |
| GET | `/api/auth/me` | Dados do usuario autenticado |
| POST | `/api/auth/usuarios` | Cria novo usuario (somente administrador) |
| GET/POST | `/api/motoristas` | Lista/cria motoristas |
| GET/PUT/DELETE | `/api/motoristas/:id` | Consulta/edita/remove motorista |
| GET/POST | `/api/veiculos` | Lista/cria veiculos |
| GET/PUT/DELETE | `/api/veiculos/:id` | Consulta/edita/remove veiculo |
| GET/POST | `/api/clientes` | Lista/cria clientes |
| GET/PUT/DELETE | `/api/clientes/:id` | Consulta/edita/remove cliente |
| GET/POST | `/api/rotas` | Lista (com filtros) / cria rotas |
| GET/PUT/DELETE | `/api/rotas/:id` | Consulta/edita/remove rota |
| GET | `/api/rotas/resumo` | Indicadores para o painel |
| POST | `/api/rotas/:id/finalizar` | Marca rota como concluida e registra chegada |
| POST | `/api/rotas/:id/cancelar` | Cancela a rota |

Filtros de listagem de rotas (`GET /api/rotas`): `status`, `motoristaId`, `veiculoId`, `dataInicio`, `dataFim`.

## Logo e identidade visual

O app foi construido com a paleta azul/branco/vermelho (azul primario `#0b3d91`, vermelho de destaque `#d1273d`). Os icones de instalacao (`frontend/public/icons/icon-192.png` e `icon-512.png`) estao como placeholders solidos na cor azul da marca.

Quando a logo oficial for enviada:

1. Substitua os arquivos em `frontend/public/icons/` pelos icones gerados a partir da logo (192x192 e 512x512, fundo solido para o icone "maskable").
2. Adicione a logo em `frontend/src/assets/` e use-a no componente `frontend/src/components/Layout.jsx` (topo do menu lateral) e na tela de login (`frontend/src/pages/Login.jsx`).
3. Se as cores exatas da logo diferirem do azul/vermelho usados, ajuste as variaveis CSS em `frontend/src/styles/theme.css` (`--azul-primario`, `--vermelho`, etc.) e o `theme_color`/icones em `frontend/vite.config.js`.

## Deploy em producao (Docker + VPS Hostinger)

### 1. Preparar a VPS

Acesse a VPS via SSH e instale Docker, Docker Compose e Nginx:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo systemctl enable --now docker
```

### 2. Clonar o repositorio

```bash
git clone https://github.com/SEU-USUARIO/trl-transportes.git
cd trl-transportes
```

### 3. Configurar variaveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` em producao:

- `DATABASE_URL`: sera sobrescrita pelo `docker-compose.yml` para usar o container `db` (nao precisa alterar se for usar o compose fornecido).
- `JWT_SECRET`: gere um valor aleatorio forte, por exemplo com `openssl rand -hex 32`.
- `CORS_ORIGIN`: coloque o dominio final do frontend (ex.: `https://seu-dominio.com.br`).

### 4. Subir os containers

```bash
docker compose build
docker compose up -d
```

Isso sobe:

- `db`: PostgreSQL na porta `5432`
- `backend`: API na porta `3001` (roda `prisma migrate deploy` automaticamente ao iniciar)
- `frontend`: build estatico do React servido por Nginx interno na porta `8080`

### 5. Criar o usuario administrador inicial

```bash
docker compose exec backend npm run seed
```

### 6. Configurar o Nginx do host (proxy reverso + HTTPS)

Copie o exemplo `nginx/trl-transportes.conf.example` para `/etc/nginx/sites-available/trl-transportes`, ajuste o dominio e ative:

```bash
sudo cp nginx/trl-transportes.conf.example /etc/nginx/sites-available/trl-transportes
sudo ln -s /etc/nginx/sites-available/trl-transportes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Gere o certificado HTTPS com Certbot:

```bash
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
```

O Certbot ajusta automaticamente o bloco HTTPS e o redirecionamento de HTTP para HTTPS.

### 7. Atualizando a aplicacao (novo deploy)

```bash
cd trl-transportes
git pull
docker compose build
docker compose up -d
```

As migrations do Prisma sao aplicadas automaticamente ao subir o container `backend`.

## Alternativa de deploy sem Docker (PM2)

Caso prefira nao usar Docker na VPS:

```bash
# Backend
cd backend
npm install --omit=dev
npx prisma migrate deploy
npm run seed
pm2 start src/index.js --name trl-backend

# Frontend
cd ../frontend
npm install
npm run build
# sirva a pasta dist/ com o Nginx do host (aponte o "root" para este diretorio)
```

Nesse cenario, configure o Nginx do host para servir os arquivos estaticos de `frontend/dist` diretamente em vez de fazer proxy para o container do frontend, mantendo o proxy de `/api/` para `http://127.0.0.1:3001/api/`.
