// GET /api/health : quelles fonctionnalités sont configurées (aucun secret renvoyé)
import { json, checkAccess } from './_lib/http.js';
import { availableProviders } from './_lib/llm.js';
import { paymentConfig } from './_lib/payments.js';

export function GET(request) {
  const providers = availableProviders();
  return json({
    ok: true,
    ai: providers.length > 0,
    providers,
    pexels: !!process.env.PEXELS_API_KEY,
    accessCode: !!process.env.ACCESS_CODE,
    accessOk: checkAccess(request),
    payments: paymentConfig(),
  });
}
