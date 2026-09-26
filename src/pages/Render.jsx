// Page technique : affiche une maquette seule (tests automatisés, captures vidéo).
// /render?tpl=delivery&frame=1&device=iphone&screen=accueil&autopilot=1
import { useEffect, useMemo, useRef } from 'react';
import { AppPlayer } from '../engine/Player.jsx';
import { localSpec, specFromHash } from '../lib/specs.js';
import { normalizeSpec } from '../../shared/normalize.js';

export default function Render() {
  const q = new URLSearchParams(location.search);
  const ref = useRef(null);
  const spec = useMemo(() => {
    if (window.__SPEC__) return normalizeSpec(window.__SPEC__).spec;
    if (location.hash.length > 1) return specFromHash(location.hash);
    return localSpec(q.get('idea') || q.get('tpl') || 'app', { category: q.get('tpl') || undefined, seed: Number(q.get('seed') || 0) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.__player = ref.current;
    window.__spec = spec;
    document.body.style.background = q.get('bg') || '#0b0a10';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const frame = q.get('frame') !== '0';
  return (
    <div className="min-h-full flex items-center justify-center" style={{ padding: frame ? 24 : 0, height: frame ? undefined : '100dvh' }}>
      <AppPlayer ref={ref} spec={spec} frame={frame} device={q.get('device') || 'iphone'} screenId={q.get('screen') || undefined} autopilot={q.get('autopilot') === '1'} mode={q.get('mode') || 'play'} style={frame ? undefined : { width: '100%', height: '100%' }} />
    </div>
  );
}
