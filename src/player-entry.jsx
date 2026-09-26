// Point d'entrée du lecteur autonome (export HTML) : aucune dépendance au studio.
import { createRoot } from 'react-dom/client';
import './index.css';
import { PlayerShell } from './pages/PlayerShell.jsx';
import { normalizeSpec } from '../shared/normalize.js';

const spec = normalizeSpec(window.__SPEC__ || {}).spec;
createRoot(document.getElementById('root')).render(<PlayerShell spec={spec} />);
