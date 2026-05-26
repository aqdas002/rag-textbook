import { describe, test, expect, beforeEach } from 'vitest';
import {
  getPreferences,
  setPreference,
  subscribePreferences,
  _resetForTests,
} from './preferences';

beforeEach(() => {
  localStorage.clear();
  _resetForTests();
});

describe('preferences', () => {
  test('getPreferences() returns defaults when localStorage is empty', () => {
    const prefs = getPreferences();
    expect(prefs.predictFirst).toBe(false);
  });

  test('setPreference updates value returned by getPreferences', () => {
    setPreference('predictFirst', true);
    const prefs = getPreferences();
    expect(prefs.predictFirst).toBe(true);
  });

  test('subscribers fire when a preference changes', () => {
    const received: boolean[] = [];
    subscribePreferences(p => received.push(p.predictFirst));
    setPreference('predictFirst', true);
    setPreference('predictFirst', false);
    expect(received).toEqual([true, false]);
  });
});
