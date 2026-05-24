import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MMRRetriever } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('MMRRetriever', () => {
    test('renders lambda slider', () => {
        render(_jsx(MMRRetriever, {}));
        const sliders = screen.getAllByRole('slider');
        expect(sliders.length).toBeGreaterThanOrEqual(1);
    });
    test('lambda = 1 produces same result as vanilla top-K', () => {
        render(_jsx(MMRRetriever, { initialLambda: 1 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        const mmrDocs = lastCall[1].mmrSelected.map((d) => d.doc);
        const vanillaDocs = lastCall[1].vanillaTopK.map((d) => d.doc);
        expect(mmrDocs).toEqual(vanillaDocs);
    });
    test('lambda = 0 produces a diverse set (divergenceCount > 0 typically)', () => {
        render(_jsx(MMRRetriever, { initialLambda: 0 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        // With lambda=0 and a diverse corpus, MMR should pick at least 1 doc not in vanilla top-3
        // (Acceptable to be 0 if corpus is small but with 8 mixed docs this should hold)
        expect(lastCall[1].divergenceCount).toBeGreaterThanOrEqual(1);
    });
});
