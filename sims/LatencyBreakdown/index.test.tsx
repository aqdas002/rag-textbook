import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LatencyBreakdown } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('LatencyBreakdown', () => {
  test('renders with testid root', () => {
    render(<LatencyBreakdown />);
    expect(screen.getByTestId('latency-breakdown')).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<LatencyBreakdown />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'LatencyBreakdown',
      expect.objectContaining({
        totalMs: expect.any(Number),
        firstTokenMs: expect.any(Number),
        rerankEnabled: expect.any(Boolean),
      }),
    );
  });
});
