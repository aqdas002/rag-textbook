import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopKRetriever } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('TopKRetriever', () => {
    test('renders K slider and all corpus docs', () => {
        render(_jsx(TopKRetriever, {}));
        expect(screen.getByRole('slider')).toBeInTheDocument();
        // 8 docs in the corpus
        const docCards = screen.getAllByTestId(/^doc-card-/);
        expect(docCards.length).toBe(8);
    });
    test('reports topK with length matching K', () => {
        render(_jsx(TopKRetriever, { initialK: 2 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[0]).toBe('TopKRetriever');
        expect(lastCall[1].k).toBe(2);
        expect(lastCall[1].topK).toHaveLength(2);
    });
    test('top result for "Tell me about Paris" includes a Paris doc', () => {
        render(_jsx(TopKRetriever, { initialK: 3 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        const topDoc = lastCall[1].topK[0].doc.toLowerCase();
        expect(topDoc).toContain('paris');
    });
});
