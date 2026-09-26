// /p#<maquette compressée> : page de présentation partageable
import { useMemo } from 'react';
import { PlayerShell } from './PlayerShell.jsx';
import { specFromHash } from '../lib/specs.js';
import { Link, go } from '../router.jsx';
import { Logo } from '../ui/kit.jsx';
import { saveProject } from '../lib/specs.js';
import { uid } from '../../shared/utils.js';

export default function PlayerPage() {
  const spec = useMemo(() => specFromHash(location.hash), []);
  if (!spec) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-5 p-8 text-center" style={{ minHeight: '100dvh' }}>
        <Logo />
        <p className="text-sand/80 max-w-sm">Ce lien de maquette est vide ou incomplet. Demande à son auteur de le renvoyer.</p>
        <Link to="/" className="h-11 px-5 rounded-xl bg-sand text-ink font-semibold flex items-center">
          Créer ma maquette
        </Link>
      </div>
    );
  }
  return (
    <PlayerShell
      spec={spec}
      onEdit={() => {
        const p = saveProject({ id: uid('p'), spec, idea: spec.meta.tagline });
        go(`/studio?id=${p.id}`);
      }}
    />
  );
}
