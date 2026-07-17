// ============================================================
//  Geração de respostas com IA (flexível)
//  Ordem de preferência: Anthropic (Claude) -> OpenAI (GPT) -> Simulado.
//  Você não precisa mudar o código: basta preencher UMA chave no .env / Railway.
// ============================================================

const SYSTEM_PROMPT = `Você é a IA de atendimento ao cliente de uma loja de e-commerce chamada "{LOJA}".
Responda em português do Brasil, de forma cordial, objetiva e humana.
Contexto/instruções da loja: {CONTEXTO}
Regras:
- Seja gentil e resolva a dúvida do cliente.
- Se faltar informação (ex.: número do pedido), peça educadamente.
- Não invente prazos, valores ou dados de pedido que você não tem.
- Assine como a equipe da loja quando fizer sentido.`;

function buildSystem({ storeName, context }) {
  return SYSTEM_PROMPT
    .replace('{LOJA}', storeName || 'a loja')
    .replace('{CONTEXTO}', context || '(nenhuma instrução adicional fornecida)');
}

// ---- Provedor: Anthropic (Claude) ----
async function replyAnthropic({ message, storeName, context }) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 500,
      system: buildSystem({ storeName, context }),
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!resp.ok) throw new Error('Anthropic HTTP ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  return data.content?.[0]?.text?.trim() || '(sem resposta)';
}

// ---- Provedor: OpenAI (GPT) ----
async function replyOpenAI({ message, storeName, context }) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        { role: 'system', content: buildSystem({ storeName, context }) },
        { role: 'user', content: message },
      ],
    }),
  });
  if (!resp.ok) throw new Error('OpenAI HTTP ' + resp.status + ': ' + (await resp.text()));
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || '(sem resposta)';
}

// ---- Fallback: resposta simulada (sem custo, sem chave) ----
function replySimulated({ message, storeName }) {
  const loja = storeName || 'nossa loja';
  const m = (message || '').toLowerCase();
  let corpo;
  if (m.includes('rastre') || m.includes('pedido') || m.includes('cadê') || m.includes('entrega')) {
    corpo = 'Consigo verificar isso para você! Pode me informar o número do pedido ou o e-mail usado na compra? Assim eu localizo o rastreio na hora. 📦';
  } else if (m.includes('troc') || m.includes('devolu') || m.includes('reembol')) {
    corpo = 'Sem problemas! Você tem até 30 dias para solicitar troca ou devolução. Me diz o número do pedido que eu já inicio o processo pra você. 🔄';
  } else if (m.includes('cancel')) {
    corpo = 'Entendo. Antes de cancelar, posso te oferecer um cupom de desconto para você continuar com a compra. Quer que eu envie? 😊';
  } else {
    corpo = 'Obrigado por entrar em contato! Já estou verificando isso para você. Pode me dar um pouco mais de detalhe sobre o que precisa?';
  }
  return `${corpo}\n\n— Equipe ${loja}\n\n(⚠️ resposta simulada — configure ANTHROPIC_API_KEY ou OPENAI_API_KEY para usar a IA de verdade)`;
}

export function activeProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'simulado';
}

export async function generateReply({ message, storeName, context }) {
  const provider = activeProvider();
  try {
    if (provider === 'anthropic') return { provider, text: await replyAnthropic({ message, storeName, context }) };
    if (provider === 'openai') return { provider, text: await replyOpenAI({ message, storeName, context }) };
  } catch (err) {
    console.error('[ai] provedor falhou, usando simulado:', err.message);
    return { provider: 'simulado (erro no provedor)', text: replySimulated({ message, storeName }) };
  }
  return { provider, text: replySimulated({ message, storeName }) };
}
