import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportState, _resetForTests } from './reportState';
describe('reportState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        _resetForTests();
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });
    afterEach(() => vi.useRealTimers());
    test('debounces multiple rapid calls into one POST', async () => {
        reportState('ChunkBoundaryExplorer', { chunkSize: 100 });
        reportState('ChunkBoundaryExplorer', { chunkSize: 200 });
        reportState('ChunkBoundaryExplorer', { chunkSize: 300 });
        expect(fetch).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(250);
        expect(fetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.simState.chunkSize).toBe(300);
    });
    test('POSTs to http://localhost:5174/state', async () => {
        reportState('Sim', { x: 1 });
        await vi.advanceTimersByTimeAsync(250);
        expect(fetch.mock.calls[0][0]).toBe('http://localhost:5174/state');
    });
    test('silently swallows fetch errors', async () => {
        fetch.mockRejectedValueOnce(new Error('connect refused'));
        reportState('Sim', { x: 1 });
        await expect(vi.advanceTimersByTimeAsync(250)).resolves.not.toThrow();
    });
    test('payload shape: { currentSim, simState, ts }', async () => {
        reportState('ChunkBoundaryExplorer', { chunkSize: 256 });
        await vi.advanceTimersByTimeAsync(250);
        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.currentSim).toBe('ChunkBoundaryExplorer');
        expect(body.simState).toEqual({ chunkSize: 256 });
        expect(typeof body.ts).toBe('string');
    });
});
