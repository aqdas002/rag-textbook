import { jsx as _jsx } from "react/jsx-runtime";
// sims/OverlapVisualizer/index.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlapVisualizer } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('OverlapVisualizer', () => {
    test('renders both chunk-size and overlap sliders', () => {
        render(_jsx(OverlapVisualizer, {}));
        expect(screen.getAllByRole('slider')).toHaveLength(2);
        expect(screen.getByText(/chunk size/i)).toBeInTheDocument();
        expect(screen.getByText(/overlap/i)).toBeInTheDocument();
    });
    test('reports both chunkSize and overlap in state', () => {
        render(_jsx(OverlapVisualizer, { initialChunkSize: 100, initialOverlap: 20 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[0]).toBe('OverlapVisualizer');
        expect(lastCall[1]).toMatchObject({ chunkSize: 100, overlap: 20 });
    });
    test('overlap cannot exceed chunkSize (clamped on report)', () => {
        render(_jsx(OverlapVisualizer, { initialChunkSize: 100, initialOverlap: 50 }));
        const overlapSlider = screen.getAllByRole('slider')[1];
        fireEvent.change(overlapSlider, { target: { value: '200' } });
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].overlap).toBeLessThanOrEqual(lastCall[1].chunkSize);
    });
});
