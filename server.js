// ============================================================
//  Atendo — servidor principal (Express)
// ============================================================
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initDb } from './src/db.js';
import authRoutes from './src/routes/auth.js';
import aiRoutes from './src/routes/ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// --- API ---
app.use('/api', authRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- Frontend (arquivos estáticos) ---
const pub = join(__dirname, 'public');
app.use(express.static(pub));

// Rotas amigáveis das páginas
app.get('/', (_req, res) => res.sendFile(join(pub, 'index.html')));
app.get('/login', (_req, res) => res.sendFile(join(pub, 'login.html')));
app.get('/signup', (_req, res) => res.sendFile(join(pub, 'signup.html')));
app.get('/app', (_req, res) => res.sendFile(join(pub, 'app.html')));

// Sobe o servidor após preparar o banco
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  Atendo rodando em http://localhost:${PORT}\n`);
    });
  })
  .catch((err) => {
    console.error('Falha ao iniciar o banco de dados:', err);
    process.exit(1);
  });
