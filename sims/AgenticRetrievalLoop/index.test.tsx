import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgenticRetrievalLoop } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('AgenticRetrievalLoop', () => {
  test('renders query selector and both panels', () => {
    render(<AgenticRetrievalLoop />);
    // Some kind of selector
    expect(
      screen.queryByRole('combobox') || screen.queryAllByRole('button').length > 0
    ).toBeTruthy();
    // Vanilla panel and agent trace panel each have at least one element with appropriate testid
    expect(screen.getByTestId('vanilla-panel')).toBeInTheDocument();
    expect(screen.getByTestId('agent-trace-panel')).toBeInTheDocument();
  });

  test('agentic retrieval reports more steps for decomposition query than for simple query', () => {
    // Query 0 = decomposition (~4 steps), Query 2 = simple (~3 steps)
    render(<AgenticRetrievalLoop initialQueryIndex={0} />);
    const decompCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    (reportState.reportState as any).mockClear();
    render(<AgenticRetrievalLoop initialQueryIndex={2} />);
    const simpleCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(decompCall[1].agentSteps).toBeGreaterThan(simpleCall[1].agentSteps);
  });

  test('agentic cost is greater than vanilla cost for the same query', () => {
    render(<AgenticRetrievalLoop />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].agenticCostUSD).toBeGreaterThan(lastCall[1].vanillaCostUSD);
  });
});
