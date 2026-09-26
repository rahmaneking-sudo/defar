// Appels aux IA (Claude, OpenAI ou compatibles, Gemini) avec bascule automatique.
import { withTimeout } from './http.js';
import { parseLoose } from '../../shared/normalize.js';

const DEFAULT_MODELS = {
  anthropic: ['claude-sonnet-5', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-6-luna', 'gpt-5-mini', 'gpt-4o-mini'],
  gemini: ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash'],
};

export function availableProviders() {
  const out = [];
  if (process.env.ANTHROPIC_API_KEY) out.push('anthropic');
  if (process.env.OPENAI_API_KEY) out.push('openai');
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) out.push('gemini');
  const pref = (process.env.AI_PROVIDER || '').toLowerCase();
  if (pref && out.includes(pref)) return [pref, ...out.filter((p) => p !== pref)];
  return out;
}

function models(provider) {
  const env = { anthropic: process.env.ANTHROPIC_MODEL, openai: process.env.OPENAI_MODEL, gemini: process.env.GEMINI_MODEL }[provider];
  const list = DEFAULT_MODELS[provider];
  return env ? [env, ...list.filter((m) => m !== env)] : list;
}

class ModelError extends Error {
  constructor(msg, { retryModel = false, status } = {}) {
    super(msg);
    this.retryModel = retryModel;
    this.status = status;
  }
}

const APP_TOOL = {
  name: 'render_app',
  description: 'Render the complete mobile app prototype described by this spec.',
  input_schema: {
    type: 'object',
    properties: {
      meta: { type: 'object' },
      theme: { type: 'object' },
      tabs: { type: 'array', items: { type: 'object' } },
      initial: { type: 'string' },
      screens: { type: 'array', items: { type: 'object' } },
    },
    required: ['meta', 'theme', 'screens'],
  },
};

async function callAnthropic(model, system, user, signal) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 16000, system, messages: [{ role: 'user', content: user }], tools: [APP_TOOL], tool_choice: { type: 'tool', name: 'render_app' } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ModelError(`Anthropic ${res.status}: ${data?.error?.message || ''}`.slice(0, 300), { retryModel: res.status === 404 || /model/i.test(data?.error?.message || ''), status: res.status });
  const tool = (data.content || []).find((c) => c.type === 'tool_use');
  if (tool?.input && typeof tool.input === 'object') return tool.input;
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return parseLoose(text);
}

async function callOpenAI(model, system, user, signal) {
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const attempt = async (extra) => {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_completion_tokens: 24000, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };
  let extra = { response_format: { type: 'json_object' }, reasoning_effort: 'low' };
  let { res, data } = await attempt(extra);
  for (let i = 0; i < 2 && res.status === 400; i++) {
    const msg = String(data?.error?.message || '');
    if (/reasoning/i.test(msg)) delete extra.reasoning_effort;
    else if (/response_format|json_object/i.test(msg)) delete extra.response_format;
    else break;
    ({ res, data } = await attempt(extra));
  }
  if (!res.ok) throw new ModelError(`OpenAI ${res.status}: ${data?.error?.message || ''}`.slice(0, 300), { retryModel: res.status === 404 || data?.error?.code === 'model_not_found', status: res.status });
  return parseLoose(data?.choices?.[0]?.message?.content || '');
}

async function callGemini(model, system, user, signal) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 24000, temperature: 0.8 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ModelError(`Gemini ${res.status}: ${data?.error?.message || ''}`.slice(0, 300), { retryModel: res.status === 404, status: res.status });
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  return parseLoose(text);
}

const CALL = { anthropic: callAnthropic, openai: callOpenAI, gemini: callGemini };

// Essaie chaque fournisseur / modèle jusqu'à obtenir un objet JSON exploitable
export async function generateJson({ system, user, budgetMs = 105_000, validate }) {
  const started = Date.now();
  const errors = [];
  let retried = false;
  for (const provider of availableProviders()) {
    const list = models(provider);
    for (let mi = 0; mi < list.length; mi++) {
      const model = list[mi];
      const left = budgetMs - (Date.now() - started);
      if (left < 8000) return { error: 'Temps dépassé', errors };
      const t = withTimeout(left);
      try {
        const obj = await CALL[provider](model, system, user, t.signal);
        t.done();
        if (!obj || typeof obj !== 'object') throw new ModelError('Réponse illisible');
        if (validate && !validate(obj)) throw new ModelError('Réponse incomplète');
        return { data: obj, provider, model, ms: Date.now() - started, errors };
      } catch (e) {
        t.done();
        errors.push(`${provider}/${model}: ${e?.message || e}`);
        if (e instanceof ModelError && e.retryModel) continue; // modèle inconnu -> modèle suivant
        // réponse illisible : une seconde chance avec le même modèle si le temps le permet
        if (!retried && /illisible|incompl/i.test(String(e?.message)) && budgetMs - (Date.now() - started) > 60_000) {
          retried = true;
          mi--;
          continue;
        }
        break; // autre erreur -> fournisseur suivant
      }
    }
  }
  return { error: errors.length ? 'Aucune IA n\'a répondu' : 'Aucune clé d\'IA configurée', errors };
}
