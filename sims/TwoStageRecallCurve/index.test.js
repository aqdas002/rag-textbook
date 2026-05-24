import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TwoStageRecallCurve } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('TwoStageRecallCurve', () => {
    test('renders latency budget slider and both recall lines', () => {
        render(_jsx(TwoStageRecallCurve, {}));
        expect(screen.getByRole('slider')).toBeInTheDocument();
        // Two SVG path elements for the two curves
        const paths = document.querySelectorAll('svg path');
        expect(paths.length).toBeGreaterThanOrEqual(2);
    });
    test('reports fits=true when latency budget >= 200', () => {
        render(_jsx(TwoStageRecallCurve, { initialBudget: 250 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].fits).toBe(true);
    });
    test('reranking lifts recall@5 by at least 10 percentage points', () => {
        render(_jsx(TwoStageRecallCurve, {}));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].recallLiftAtK5).toBeGreaterThanOrEqual(0.10);
    });
});
