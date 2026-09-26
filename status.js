// GET /api/pay/status?p=wave&id=cos-... | ?p=wave&ref=... | ?token=... (PayDunya) | ?p=sim&id=...&ok=1
// Vérifie le statut AUPRÈS de l'opérateur (on ne fait jamais confiance au navigateur).
import { json, corsHeaders, preflight } from '../_lib/http.js';
import { waveGet, paydunyaGet, hasWave, hasPayDunya } from '../_lib/payments.js';

export function OPTIONS(request) {
  return preflight(request);
}

export async function GET(request) {
  const cors = corsHeaders(request);
  const q = new URL(request.url).searchParams;
  const p = q.get('p') || (q.get('token') ? 'paydunya' : '');
  try {
    if (p === 'wave') {
      if (!hasWave()) return json({ status: 'unknown', message: 'Wave non configuré' }, 200, cors);
      return json(await waveGet({ id: q.get('id'), reference: q.get('ref') }), 200, cors);
    }
    if (p === 'paydunya') {
      if (!hasPayDunya()) return json({ status: 'unknown', message: 'PayDunya non configuré' }, 200, cors);
      const token = q.get('token') || q.get('id');
      if (!token) return json({ status: 'unknown' }, 200, cors);
      return json(await paydunyaGet({ token }), 200, cors);
    }
    if (p === 'sim') {
      return json({ status: q.get('ok') === '1' ? 'paid' : 'failed', simulated: true, amount: Number(q.get('a')) || undefined, reference: q.get('ref') || undefined, id: q.get('id') }, 200, cors);
    }
    return json({ status: 'unknown' }, 200, cors);
  } catch (e) {
    return json({ status: 'unknown', message: e.message }, 200, cors);
  }
}
