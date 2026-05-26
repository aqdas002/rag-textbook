import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopNvsRerankCost } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('TopNvsRerankCost', () => {
  test('renders with testid root, slider, and initial values', () => {
    render(<TopNvsRerankCost />);
    expect(screen.getByTestId('top-n-vs-rerank-cost')).toBeInTheDocument();
    expect(screen.getByTestId('n-slider')).toBeInTheDocument();
    // Default N=20 is in the sweet spot
    expect(screen.getByTestId('sweet-badge')).toBeInTheDocument();
    expect(screen.getByTestId('selected-n').textContent).toBe('20');
  });

  test('reportState called with correct shape including inSweetSpot', () => {
    render(<TopNvsRerankCost />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'TopNvsRerankCost',
      expect.objectContaining({
        selectedN: 20,
        latencyMs: 150,   // 30 + 6*20
        costPer1K: 2.0,   // 0.10 * 20
        inSweetSpot: true,
      }),
    );
  });
});
