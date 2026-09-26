import { createContext, useContext } from 'react';

export const RtCtx = createContext(null);
export const ScreenCtx = createContext(null);

export const useRt = () => useContext(RtCtx);
export const useScreen = () => useContext(ScreenCtx);

// Premier écran contenant un type de bloc donné
export function computeRoutes(spec) {
  const first = (type) => spec.screens.find((s) => s.blocks.some((b) => b.type === type))?.id || null;
  const home =
    spec.tabs?.[0]?.screen ||
    spec.screens.find((s) => /accueil|home/.test(s.id))?.id ||
    spec.screens.find((s) => !['onboarding', 'auth'].includes(s.blocks[0]?.type))?.id ||
    spec.initial;
  return {
    home,
    detail: first('detail'),
    cart: first('cart'),
    checkout: first('checkout'),
    success: first('success'),
    booking: first('booking'),
    tracking: first('tracking'),
    chat: first('chat'),
    profile: first('profile'),
    auth: first('auth'),
    ticket: first('ticket'),
  };
}
