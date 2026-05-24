import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimilarityScorer } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('SimilarityScorer', () => {
    test('renders two phrase inputs', () => {
        render(_jsx(SimilarityScorer, {}));
        expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });
    test('similar phrases get high similarity, dissimilar get low', () => {
        render(_jsx(SimilarityScorer, { initialA: "king queen prince", initialB: "crown royalty kingdom" }));
        const lastCallHigh = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCallHigh[1].similarity).toBeGreaterThan(0.5);
        reportState.reportState.mockClear();
        render(_jsx(SimilarityScorer, { initialA: "king queen", initialB: "pizza burger" }));
        const lastCallLow = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCallLow[1].similarity).toBeLessThan(0.3);
    });
    test('reports recognized words for each phrase', () => {
        render(_jsx(SimilarityScorer, { initialA: "the king sleeps", initialB: "a cat purrs" }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].recognizedA).toContain('king');
        expect(lastCall[1].recognizedB).toContain('cat');
    });
});
