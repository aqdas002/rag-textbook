import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BM25FormulaBreakdown } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('BM25FormulaBreakdown', () => {
  test('renders formula parts with color-coded labels and radio controls', () => {
    render(<BM25FormulaBreakdown />);
    expect(screen.getByTestId('bm25-formula')).toBeInTheDocument();
    expect(screen.getByTestId('query-radio-the-king')).toBeInTheDocument();
    expect(screen.getByTestId('query-radio-e-auth-4096')).toBeInTheDocument();
    expect(screen.getByTestId('query-radio-user-account')).toBeInTheDocument();
    expect(screen.getByTestId('breakdown-panel')).toBeInTheDocument();
  });

  test('reportState called with correct shape on render and query change', async () => {
    const user = userEvent.setup();
    render(<BM25FormulaBreakdown />);
    const calls = (reportState.reportState as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [simId, state] = calls[calls.length - 1];
    expect(simId).toBe('BM25FormulaBreakdown');
    expect(state).toHaveProperty('exampleQuery');
    expect(state).toHaveProperty('dominantTerm');

    // Switch to the error-code query
    await user.click(screen.getByTestId('query-radio-e-auth-4096'));
    const updatedCalls = (reportState.reportState as ReturnType<typeof vi.fn>).mock.calls;
    const [, updatedState] = updatedCalls[updatedCalls.length - 1];
    expect(updatedState.exampleQuery).toBe('E_AUTH_4096');
  });
});
