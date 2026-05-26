import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RRFMechanism } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('RRFMechanism', () => {
  test('renders three columns (BM25, merged, dense) and a k slider', () => {
    render(<RRFMechanism />);
    expect(screen.getByTestId('rrf-bm25-col')).toBeInTheDocument();
    expect(screen.getByTestId('rrf-dense-col')).toBeInTheDocument();
    expect(screen.getByTestId('rrf-merged-col')).toBeInTheDocument();
    expect(screen.getByTestId('rrf-k-slider')).toBeInTheDocument();
  });

  test('reportState called with kConstant and topMergedDoc', () => {
    render(<RRFMechanism />);
    const calls = (reportState.reportState as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [simId, state] = calls[calls.length - 1];
    expect(simId).toBe('RRFMechanism');
    expect(state).toHaveProperty('kConstant');
    expect(state).toHaveProperty('topMergedDoc');
    expect(typeof state.kConstant).toBe('number');
    expect(state.kConstant).toBe(60); // default
  });
});
