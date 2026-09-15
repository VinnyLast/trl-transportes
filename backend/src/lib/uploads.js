const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const PASTA_ROMANEIOS = path.join(__dirname, '..', '..', 'uploads', 'romaneios');
fs.mkdirSync(PASTA_ROMANEIOS, { recursive: true });

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PASTA_ROMANEIOS),
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extensao}`);
  },
});

const uploadRomaneio = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Envie uma imagem valida (JPEG, PNG, WEBP ou HEIC).'));
    }
    cb(null, true);
  },
});

module.exports = { uploadRomaneio, PASTA_ROMANEIOS };
