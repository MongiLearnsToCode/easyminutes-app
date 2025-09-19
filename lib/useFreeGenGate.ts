import { useCallback, useMemo, useState } from 'react';

const DEFAULT_LIMIT = 5;
const LS_OVERRIDE_KEY = 'freeGenLimit';
const SS_COUNT_KEY = 'genCount';

const readLimit = (): number => {
  let limit = DEFAULT_LIMIT;
  try {
    const override = localStorage.getItem(LS_OVERRIDE_KEY);
    if (override) {
      const n = parseInt(override, 10);
      if (!Number.isNaN(n) && n > 0) limit = n;
    }
  } catch {}
  return limit;
};

const readCount = (): number => {
  try { return parseInt(sessionStorage.getItem(SS_COUNT_KEY) || '0', 10) || 0; } catch { return 0; }
};
const writeCount = (n: number) => { try { sessionStorage.setItem(SS_COUNT_KEY, String(n)); } catch {} };

export interface FreeGenGate {
  canGenerate: boolean;
  remaining: number;
  increment: () => void;
  requirePro: boolean;
  openProModal: () => void;
}

export const useFreeGenGate = (): FreeGenGate => {
  useState(false);
  const limit = useMemo(readLimit, []);
  const count = readCount();
  const remaining = Math.max(0, limit - count);
  const canGenerate = remaining > 0;
  const requirePro = !canGenerate;

  if (remaining <= 1) {
    console.warn(`Free generations remaining: ${remaining}`);
  }

  const increment = useCallback(() => {
    const next = readCount() + 1;
    writeCount(next);
  }, []);

  const openProModal = useCallback(() => { setProModal(true); }, []);

  return { canGenerate, remaining, increment, requirePro, openProModal };
};

export const gateAndGenerate = async <T>(gate: FreeGenGate, fn: () => Promise<T>): Promise<T | null> => {
  if (gate.requirePro) {
    console.warn('Generation blocked: free limit reached');
    gate.openProModal();
    return null;
  }
  const result = await fn();
  gate.increment();
  return result;
};
