// src/lib/stateFile.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribeToPendingGrade, _stopForTests, _setIntervalMs } from './stateFile';

describe('stateFile poller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _setIntervalMs(100);
    global.fetch = vi.fn();
  });
  afterEach(() => {
    _stopForTests();
    vi.useRealTimers();
  });

  test('calls subscriber when a grade appears in pendingGrades map', async () => {
    let calls: any[] = [];
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pendingAnswers: { c1: { concept: 'c1', answer: 'a' } } }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pendingAnswers: { c1: { concept: 'c1', answer: 'a' } },
        pendingGrades: { c1: { concept: 'c1', rating: 3, comment: 'good' } },
      }),
    });

    subscribeToPendingGrade(g => calls.push(g));
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ concept: 'c1', rating: 3, comment: 'good' });
  });

  test('does not double-fire for the same grade on the same concept', async () => {
    let calls = 0;
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ pendingGrades: { c1: { concept: 'c1', rating: 3, comment: '' } } }),
    });
    subscribeToPendingGrade(() => calls++);
    await vi.advanceTimersByTimeAsync(300);
    expect(calls).toBe(1);
  });

  test('fires for each distinct concept in pendingGrades', async () => {
    let calls: any[] = [];
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        pendingGrades: {
          c1: { concept: 'c1', rating: 3, comment: '' },
          c2: { concept: 'c2', rating: 4, comment: '' },
        },
      }),
    });
    subscribeToPendingGrade(g => calls.push(g));
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(2);
    expect(calls.map(c => c.concept).sort()).toEqual(['c1', 'c2']);
  });

  test('silently swallows fetch errors', async () => {
    (fetch as any).mockRejectedValue(new Error('404'));
    subscribeToPendingGrade(() => {});
    await expect(vi.advanceTimersByTimeAsync(300)).resolves.not.toThrow();
  });
});
