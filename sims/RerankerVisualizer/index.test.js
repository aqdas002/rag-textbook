import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RerankerVisualizer } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('RerankerVisualizer', () => {
    test('renders K slider and both columns', () => {
        render(_jsx(RerankerVisualizer, {}));
        expect(screen.getByRole('slider')).toBeInTheDocument();
        // 10 bi-encoder rows + up to K reranked rows
        expect(screen.getAllByTestId(/^bi-row-/)).toHaveLength(10);
        expect(screen.getAllByTestId(/^rerank-row-/).length).toBeGreaterThanOrEqual(1);
    });
    test('reranker correctly promotes the high-relevance "revoke" doc into rerank top-3', () => {
        render(_jsx(RerankerVisualizer, { initialK: 5 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        // The doc with relevance 1.0 should be in the reranked top-3
        const topThreeReranked = lastCall[1].reranked.slice(0, 3).map((d) => d.text);
        expect(topThreeReranked.some((t) => t.toLowerCase().includes('remove permissions'))).toBe(true);
    });
    test('reports promotedToTop3 count >= 1', () => {
        render(_jsx(RerankerVisualizer, { initialK: 5 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].promotedToTop3).toBeGreaterThanOrEqual(1);
    });
});
