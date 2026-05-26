import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SparseDenseRepresentation } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('SparseDenseRepresentation', () => {
  test('renders sparse panel, dense panel, and comparison table', () => {
    render(<SparseDenseRepresentation />);
    expect(screen.getByTestId('sparse-panel')).toBeInTheDocument();
    expect(screen.getByTestId('dense-panel')).toBeInTheDocument();
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  test('reportState called with rendered: true', () => {
    render(<SparseDenseRepresentation />);
    const calls = (reportState.reportState as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [simId, state] = calls[calls.length - 1];
    expect(simId).toBe('SparseDenseRepresentation');
    expect(state).toEqual({ rendered: true });
  });
});
