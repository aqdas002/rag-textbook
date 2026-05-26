import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DimensionTradeoffChart } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('DimensionTradeoffChart', () => {
  test('renders with testid root', () => {
    render(<DimensionTradeoffChart />);
    expect(screen.getByTestId('dimension-tradeoff-chart')).toBeInTheDocument();
  });

  test('reportState called with correct shape on mount (default 1024 dim)', () => {
    render(<DimensionTradeoffChart />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'DimensionTradeoffChart',
      expect.objectContaining({
        selectedDim: 1024,
        qualityAtSelected: 0.96,
        storageReductionPct: expect.any(Number),
      }),
    );
  });
});
