// ============================================================
//  Autenticação: hash de senha (bcrypt) + token de login (JWT em cookie)
// ============================================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-inseguro-troque-em-producao';
const COOKIE = 'atendo_token';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function issueToken(res, user) {
  const token = jwt.sign(
    { uid: user.id, email: user.email, name: user.name },
    SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS,
  });
}

export function clearToken(res) {
  res.clearCookie(COOKIE);
}

// Middleware: exige login. Coloca req.user = { uid, email, name }.
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
}

// Igual ao anterior, mas não bloqueia: só popula req.user se houver login.
export function optionalAuth(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* ignora */ }
  }
  next();
}
