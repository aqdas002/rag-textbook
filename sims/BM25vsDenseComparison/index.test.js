import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BM25vsDenseComparison } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('BM25vsDenseComparison', () => {
    test('renders three result columns and a query selector', () => {
        render(_jsx(BM25vsDenseComparison, {}));
        // Query selector
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        // 3 columns, each with their docs
        expect(screen.getAllByTestId(/^bm25-row-/).length).toBeGreaterThan(0);
        expect(screen.getAllByTestId(/^dense-row-/).length).toBeGreaterThan(0);
        expect(screen.getAllByTestId(/^hybrid-row-/).length).toBeGreaterThan(0);
    });
    test('BM25 ranks the error-code doc #1 for the error-code query', () => {
        render(_jsx(BM25vsDenseComparison, { initialQueryIndex: 0 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].activeQuery).toMatch(/E_AUTH_4096/);
        expect(lastCall[1].bm25Top[0].docId).toBe(0);
    });
    test('dense ranks the paraphrased refund doc near the top for the refund query', () => {
        // initialQueryIndex 2 = "How do I get my money back?" with correctDocId = 9
        render(_jsx(BM25vsDenseComparison, { initialQueryIndex: 2 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        const topDenseIds = lastCall[1].denseTop.slice(0, 3).map((d) => d.docId);
        expect(topDenseIds).toContain(9);
    });
});
