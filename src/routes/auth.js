// ============================================================
//  Rotas de autenticação: /api/signup, /api/login, /api/logout, /api/me
// ============================================================
import { Router } from 'express';
import { findUserByEmail, createUser, findUserById } from '../db.js';
import { hashPassword, checkPassword, issueToken, clearToken, requireAuth } from '../auth.js';

const router = Router();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -- Cadastro --
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Informe seu nome.' });
    if (!email || !emailRe.test(email)) return res.status(400).json({ error: 'E-mail inválido.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });

    const password_hash = await hashPassword(password);
    const user = await createUser({ name, email, password_hash });
    issueToken(res, user);
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.code === 'DUP') return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    console.error('[signup]', err);
    return res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

// -- Login --
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    const ok = await checkPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

    issueToken(res, user);
    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Erro ao entrar.' });
  }
});

// -- Logout --
router.post('/logout', (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

// -- Quem sou eu (dados do usuário logado) --
router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.uid);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
  res.json({ user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at } });
});

export default router;
