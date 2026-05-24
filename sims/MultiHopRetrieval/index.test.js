import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MultiHopRetrieval } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('MultiHopRetrieval', () => {
    test('renders the graph SVG and the query selector', () => {
        render(_jsx(MultiHopRetrieval, {}));
        // SVG with nodes
        const nodes = document.querySelectorAll('[data-testid^="graph-node-"]');
        expect(nodes.length).toBeGreaterThanOrEqual(8);
        // Query selector (could be buttons or a dropdown)
        const selector = screen.queryByRole('combobox') ?? screen.queryAllByRole('button')[0];
        expect(selector).toBeTruthy();
    });
    test('vanilla RAG cannot answer the 3-hop query', () => {
        // Select query 3 (3-hop)
        render(_jsx(MultiHopRetrieval, { initialQueryIndex: 2 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].hops).toBe(3);
        expect(lastCall[1].vanillaAnswered).toBe(false);
        expect(lastCall[1].graphAnswered).toBe(true);
    });
    test('graph path length matches hop count', () => {
        render(_jsx(MultiHopRetrieval, { initialQueryIndex: 1 }));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        // Path length should be hops + 1 (n hops = n+1 nodes visited)
        expect(lastCall[1].graphPath.length).toBeGreaterThanOrEqual(lastCall[1].hops + 1);
    });
});
