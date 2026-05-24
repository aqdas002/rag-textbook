import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgenticRetrievalLoop } from './index';
import * as reportState from '../../src/lib/reportState';
vi.mock('../../src/lib/reportState');
describe('AgenticRetrievalLoop', () => {
    test('renders query selector and both panels', () => {
        render(_jsx(AgenticRetrievalLoop, {}));
        // Some kind of selector
        expect(screen.queryByRole('combobox') || screen.queryAllByRole('button').length > 0).toBeTruthy();
        // Vanilla panel and agent trace panel each have at least one element with appropriate testid
        expect(screen.getByTestId('vanilla-panel')).toBeInTheDocument();
        expect(screen.getByTestId('agent-trace-panel')).toBeInTheDocument();
    });
    test('agentic retrieval reports more steps for decomposition query than for simple query', () => {
        // Query 0 = decomposition (~4 steps), Query 2 = simple (~3 steps)
        render(_jsx(AgenticRetrievalLoop, { initialQueryIndex: 0 }));
        const decompCall = reportState.reportState.mock.calls.slice(-1)[0];
        reportState.reportState.mockClear();
        render(_jsx(AgenticRetrievalLoop, { initialQueryIndex: 2 }));
        const simpleCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(decompCall[1].agentSteps).toBeGreaterThan(simpleCall[1].agentSteps);
    });
    test('agentic cost is greater than vanilla cost for the same query', () => {
        render(_jsx(AgenticRetrievalLoop, {}));
        const lastCall = reportState.reportState.mock.calls.slice(-1)[0];
        expect(lastCall[1].agenticCostUSD).toBeGreaterThan(lastCall[1].vanillaCostUSD);
    });
});
