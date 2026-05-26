import { useEffect, useState } from 'react';

export interface Preferences {
  predictFirst: boolean;
}

const STORAGE_KEY = 'prefs.v1';
const DEFAULTS: Preferences = { predictFirst: false };

const listeners = new Set<(prefs: Preferences) => void>();
let cache: Preferences | null = null;

function load(): Preferences {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

function save(): void {
  if (!cache) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach(l => l(cache!));
}

export function getPreferences(): Preferences {
  return { ...load() };
}

export function setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
  const p = load();
  p[key] = value;
  save();
}

export function subscribePreferences(listener: (prefs: Preferences) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reset internal cache — exported for test isolation only. */
export function _resetForTests(): void {
  cache = null;
  listeners.clear();
}

// React hook for components
export function usePreferences(): Preferences {
  const [prefs, setPrefs] = useState(getPreferences);
  useEffect(() => subscribePreferences(setPrefs), []);
  return prefs;
}
