import { useEffect, useState } from 'react';

// Mini-routeur (History API) : pas de dépendance, compatible Vercel (rewrites -> index.html)
export function useRoute() {
  const read = () => ({ path: location.pathname.replace(/\/+$/, '') || '/', search: new URLSearchParams(location.search), hash: location.hash });
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => setR(read());
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  return r;
}

export function go(to, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', to);
  else history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function Link({ to, children, className, style, onClick, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || /^https?:/.test(to)) return;
        e.preventDefault();
        onClick?.(e);
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
