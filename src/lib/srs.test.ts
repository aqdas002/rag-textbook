import { describe, test, expect, beforeEach } from 'vitest';
import { createCard, gradeCard, getDueCards, getAllCards, _clearAll } from './srs';

describe('srs', () => {
  beforeEach(() => {
    _clearAll();
    localStorage.clear();
  });

  test('createCard adds a new card with due date = now', () => {
    const before = Date.now();
    createCard('chunk-size-tradeoff', 'Explain the chunk size tradeoff.');
    const cards = getAllCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].concept).toBe('chunk-size-tradeoff');
    expect(new Date(cards[0].dueAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  test('gradeCard with Easy (4) pushes due date out by days', () => {
    createCard('c1', 'q');
    gradeCard('c1', 4);
    const cards = getAllCards();
    const due = new Date(cards[0].dueAt).getTime();
    const oneDayFromNow = Date.now() + 24 * 3600 * 1000;
    expect(due).toBeGreaterThan(oneDayFromNow);
  });

  test('gradeCard with Again (1) keeps due date near now', () => {
    createCard('c1', 'q');
    gradeCard('c1', 1);
    const cards = getAllCards();
    const due = new Date(cards[0].dueAt).getTime();
    expect(due - Date.now()).toBeLessThan(60 * 60 * 1000); // < 1h
  });

  test('getDueCards returns only cards with dueAt <= now', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 4); // pushed out
    createCard('c2', 'q2'); // due now
    const due = getDueCards();
    expect(due.map(c => c.concept)).toEqual(['c2']);
  });

  test('persists to localStorage and reloads', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 3);
    const stored = localStorage.getItem('srs.v1');
    expect(stored).toBeTruthy();
    _clearAll();
    expect(getAllCards()).toHaveLength(0);
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(1);
    expect(parsed.cards.c1).toBeDefined();
  });

  test('createCard is idempotent on existing concept (does not reset progress)', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 4);
    const dueAfterFirst = getAllCards()[0].dueAt;
    createCard('c1', 'q1-revised'); // no-op
    expect(getAllCards()[0].dueAt).toBe(dueAfterFirst);
  });
});
