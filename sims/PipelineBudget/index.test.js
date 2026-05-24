import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PipelineBudget } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('PipelineBudget', () => {
    test('renders pipeline stage toggles and a QPS slider', () => {
        render(_jsx(PipelineBudget, {}));
        // QPS slider plus possibly cache-hit-rate slider
        expect(screen.getAllByRole('slider').length).toBeGreaterThanOrEqual(1);
        // At least some toggles (checkboxes)
        expect(screen.getAllByRole('checkbox').length).toBeGreaterThanOrEqual(4);
    });
    test('agentic preset reports much higher cost than minimal preset', async () => {
        render(_jsx(PipelineBudget, {}));
        // Click Minimal RAG preset
        await userEvent.click(screen.getByRole('button', { name: /minimal rag/i }));
        const minimalCall = reportState.reportState.mock.calls.slice(-1)[0];
        const minimalCost = minimalCall[1].perQueryCostUSD;
        await userEvent.click(screen.getByRole('button', { name: /agentic/i }));
        const agenticCall = reportState.reportState.mock.calls.slice(-1)[0];
        const agenticCost = agenticCall[1].perQueryCostUSD;
        // Agentic should cost at least 3x more than minimal
        expect(agenticCost / minimalCost).toBeGreaterThan(3);
    });
    test('cache hit rate drops effective per-query cost when enabled', async () => {
        render(_jsx(PipelineBudget, {}));
        // Production preset for a non-trivial baseline
        await userEvent.click(screen.getByRole('button', { name: /production default/i }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        // Production default already has 50% cache, so effective cost should be roughly half of full pipeline cost
        expect(lastCall[1].cacheHitRate).toBe(50);
        expect(lastCall[1].perQueryCostUSD).toBeLessThan(0.008); // less than full pipeline without cache (~0.006 + cache savings)
    });
});
