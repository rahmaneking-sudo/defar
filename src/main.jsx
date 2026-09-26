import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { useRoute } from './router.jsx';
import { siteFromHost } from './lib/host.js';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Studio = lazy(() => import('./studio/Studio.jsx'));
const PlayerPage = lazy(() => import('./pages/PlayerPage.jsx'));
const Gallery = lazy(() => import('./pages/Gallery.jsx'));
const PayPage = lazy(() => import('./pages/pay/PayPage.jsx'));
const PayReturn = lazy(() => import('./pages/pay/PayReturn.jsx'));
const PaySimulator = lazy(() => import('./pages/pay/PaySimulator.jsx'));
const Payments = lazy(() => import('./pages/pay/Payments.jsx'));
const Render = lazy(() => import('./pages/Render.jsx'));
const AuthPage = lazy(() => import('./pages/account/AuthPage.jsx'));
const Espace = lazy(() => import('./pages/account/Espace.jsx'));
const Admin = lazy(() => import('./pages/account/Admin.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const PublicSite = lazy(() => import('./pages/PublicSite.jsx'));
const HOST_SITE = siteFromHost();

function Loader() {
  return (
    <div className="h-full flex items-center justify-center bg-ink">
      <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-sunset animate-spin" />
    </div>
  );
}

function App() {
  const { path } = useRoute();
  let Page = Landing;
  if (HOST_SITE || path.startsWith('/s/')) Page = PublicSite;
  else if (path.startsWith('/studio')) Page = Studio;
  else if (path === '/connexion' || path === '/nouveau-mot-de-passe') Page = AuthPage;
  else if (path.startsWith('/espace')) Page = Espace;
  else if (path.startsWith('/admin')) Page = Admin;
  else if (path.startsWith('/tarifs')) Page = Pricing;
  else if (path === '/p' || path.startsWith('/p/')) Page = PlayerPage;
  else if (path.startsWith('/galerie')) Page = Gallery;
  else if (path === '/pay/retour') Page = PayReturn;
  else if (path === '/pay/simulateur') Page = PaySimulator;
  else if (path.startsWith('/pay')) Page = PayPage;
  else if (path.startsWith('/paiements')) Page = Payments;
  else if (path.startsWith('/render')) Page = Render;
  return (
    <Suspense fallback={<Loader />}>
      <Page />
    </Suspense>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
