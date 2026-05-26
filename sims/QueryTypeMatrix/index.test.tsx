import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryTypeMatrix } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('QueryTypeMatrix', () => {
  test('renders table with correct column headers and all 5 query-type rows', () => {
    render(<QueryTypeMatrix />);
    expect(screen.getByTestId('query-type-matrix')).toBeInTheDocument();
    expect(screen.getByText('BM25 alone')).toBeInTheDocument();
    expect(screen.getByText('Dense alone')).toBeInTheDocument();
    expect(screen.getByText('Hybrid RRF')).toBeInTheDocument();
    // Check row labels are present
    expect(screen.getByTestId('row-exact-identifier')).toBeInTheDocument();
    expect(screen.getByTestId('row-error-code')).toBeInTheDocument();
    expect(screen.getByTestId('row-synonym')).toBeInTheDocument();
    expect(screen.getByTestId('row-multi-keyword')).toBeInTheDocument();
    expect(screen.getByTestId('row-multi-faceted')).toBeInTheDocument();
  });

  test('reportState called with rendered: true', () => {
    render(<QueryTypeMatrix />);
    const calls = (reportState.reportState as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [simId, state] = calls[calls.length - 1];
    expect(simId).toBe('QueryTypeMatrix');
    expect(state).toEqual({ rendered: true });
  });
});
