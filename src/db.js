// ============================================================
//  Camada de banco de dados
//  - Se DATABASE_URL estiver definida, usa PostgreSQL (produção/Railway).
//  - Caso contrário, usa um armazenamento EM MEMÓRIA (só para testes locais;
//    os dados somem quando o servidor reinicia).
// ============================================================
import pg from 'pg';

const { Pool } = pg;
const hasPg = !!process.env.DATABASE_URL;

let pool = null;

// ---- Fallback em memória ----
const mem = {
  users: [],           // { id, name, email, password_hash, created_at }
  seq: 1,
};

export async function initDb() {
  if (hasPg) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Railway exige SSL nas conexões externas; em rede interna funciona também.
      ssl: process.env.DATABASE_URL.includes('railway')
        ? { rejectUnauthorized: false }
        : false,
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('[db] PostgreSQL conectado e pronto.');
  } else {
    console.warn('[db] DATABASE_URL não definida — usando armazenamento EM MEMÓRIA (apenas testes locais).');
  }
}

// Busca usuário por e-mail (retorna null se não achar)
export async function findUserByEmail(email) {
  const e = email.toLowerCase().trim();
  if (hasPg) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [e]);
    return rows[0] || null;
  }
  return mem.users.find(u => u.email === e) || null;
}

export async function findUserById(id) {
  if (hasPg) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }
  return mem.users.find(u => u.id === Number(id)) || null;
}

// Cria usuário. Lança erro se e-mail já existir.
export async function createUser({ name, email, password_hash }) {
  const e = email.toLowerCase().trim();
  if (hasPg) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), e, password_hash]
    );
    return rows[0];
  }
  if (mem.users.some(u => u.email === e)) {
    const err = new Error('E-mail já cadastrado');
    err.code = 'DUP';
    throw err;
  }
  const user = {
    id: mem.seq++,
    name: name.trim(),
    email: e,
    password_hash,
    created_at: new Date().toISOString(),
  };
  mem.users.push(user);
  return { id: user.id, name: user.name, email: user.email, created_at: user.created_at };
}
