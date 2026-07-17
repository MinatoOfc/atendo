# Atendo — base do SaaS de atendimento com IA

App full-stack (Node.js + Express + PostgreSQL) com **cadastro/login reais**, **dashboard protegido** e **endpoint de IA** (Claude ou OpenAI, com fallback simulado). Feito para subir no **Railway**.

Esta é a **Etapa 1** (a base). Próximas etapas: integração com loja (Shopify/Nuvemshop), pagamento (Stripe) e painel admin.

---

## O que já funciona

- Página inicial (landing) em `/`
- Cadastro em `/signup` e login em `/login` (senha com hash bcrypt + sessão via cookie JWT)
- Painel protegido em `/app` (só acessa quem está logado)
- Playground da IA no painel: você digita a mensagem de um cliente e a IA responde
- IA flexível: usa **Claude** ou **OpenAI** conforme a chave que você colocar; sem chave, responde com uma simulação

---

## Rodar no seu computador (opcional)

Precisa de Node.js 18+.

```bash
npm install
cp .env.example .env      # e edite o .env (pode deixar DATABASE_URL vazio para testar)
npm start
```

Abra http://localhost:3000

> Sem `DATABASE_URL`, os usuários ficam só na memória (somem ao reiniciar). Isso é só para teste local. Em produção use PostgreSQL.

---

## Publicar no Railway (passo a passo)

### 1. Suba o código para o GitHub
Crie um repositório no GitHub e envie esta pasta. (Se você não usa git, dá pra subir os arquivos direto pelo site do GitHub em "Add file → Upload files".)

### 2. Crie o projeto no Railway
1. Acesse https://railway.app e entre com sua conta GitHub.
2. Clique em **New Project → Deploy from GitHub repo** e escolha o repositório.
3. O Railway detecta que é Node.js e faz o deploy sozinho (roda `npm install` e `npm start`).

### 3. Adicione o banco de dados PostgreSQL
1. Dentro do projeto, clique em **New → Database → Add PostgreSQL**.
2. O Railway cria a variável `DATABASE_URL` automaticamente e a compartilha com o app.
   - Se não compartilhar sozinha: no serviço do app, vá em **Variables → New Variable → Add Reference** e selecione `DATABASE_URL` do Postgres.

### 4. Configure as variáveis de ambiente
No serviço do app, aba **Variables**, adicione:

| Variável | Valor |
|---|---|
| `JWT_SECRET` | um texto longo e aleatório (veja abaixo como gerar) |
| `NODE_ENV` | `production` |
| `ANTHROPIC_API_KEY` | *(opcional)* sua chave do Claude |
| `OPENAI_API_KEY` | *(opcional)* sua chave da OpenAI |

`DATABASE_URL` e `PORT` o Railway preenche sozinho — não precisa mexer.

Para gerar o `JWT_SECRET`, rode no seu terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 5. Gere o domínio público
No serviço do app, vá em **Settings → Networking → Generate Domain**. Pronto — seu site está no ar num endereço `algum-nome.up.railway.app`.

### 6. (Opcional) Ligue a IA de verdade
- **Claude:** crie uma chave em https://console.anthropic.com → API Keys e cole em `ANTHROPIC_API_KEY`.
- **OpenAI:** crie uma chave em https://platform.openai.com/api-keys e cole em `OPENAI_API_KEY`.

Preencha só uma. O app usa Claude se as duas estiverem preenchidas. Sem nenhuma, ele usa a resposta simulada (bom para testar sem gastar).

---

## Estrutura do projeto

```
atendo/
├─ server.js            # servidor Express (API + serve o frontend)
├─ package.json
├─ railway.json         # configuração de deploy do Railway
├─ .env.example         # modelo das variáveis de ambiente
├─ src/
│  ├─ db.js             # banco (PostgreSQL, com fallback em memória)
│  ├─ auth.js           # bcrypt + JWT em cookie
│  └─ routes/
│     ├─ auth.js        # /api/signup, /api/login, /api/logout, /api/me
│     └─ ai.js          # /api/ai/reply, /api/ai/status
└─ public/
   ├─ index.html        # landing page
   ├─ login.html
   ├─ signup.html
   ├─ app.html          # painel (dashboard)
   └─ theme.css         # estilos
```

---

## Próximas etapas (quando você quiser)

2. **Integração com loja** — conectar Shopify/Nuvemshop para puxar pedidos e rastreio reais.
3. **Conversas reais** — receber mensagens (e-mail/WhatsApp) e responder automaticamente.
4. **Pagamento** — Stripe para cobrar assinaturas.
5. **Painel admin** — gerenciar clientes, planos e métricas.

É só me chamar para a próxima. 🚀
