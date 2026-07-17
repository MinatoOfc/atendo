// ============================================================
//  Rota de IA: /api/ai/reply  (protegida por login)
// ============================================================
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { generateReply, activeProvider } from '../ai.js';

const router = Router();

// Informa qual provedor está ativo (para o dashboard mostrar)
router.get('/status', requireAuth, (_req, res) => {
  res.json({ provider: activeProvider() });
});

// Gera uma resposta para a mensagem de um cliente
router.post('/reply', requireAuth, async (req, res) => {
  const { message, storeName, context } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Envie a mensagem do cliente.' });
  }
  try {
    const result = await generateReply({
      message: message.trim(),
      storeName: (storeName || '').trim(),
      context: (context || '').trim(),
    });
    res.json(result);
  } catch (err) {
    console.error('[ai/reply]', err);
    res.status(500).json({ error: 'Erro ao gerar resposta.' });
  }
});

export default router;
