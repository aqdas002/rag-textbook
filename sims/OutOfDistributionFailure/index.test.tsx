import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutOfDistributionFailure } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('OutOfDistributionFailure', () => {
  test('renders with testid root and in-distribution state by default', () => {
    render(<OutOfDistributionFailure />);
    expect(screen.getByTestId('out-of-distribution-failure')).toBeInTheDocument();
    expect(screen.getByTestId('query-text')).toBeInTheDocument();
    expect(screen.getByTestId('results-list')).toBeInTheDocument();
    expect(screen.getByTestId('verdict')).toBeInTheDocument();
    // default is in-distribution; verdict should say correct
    expect(screen.getByTestId('verdict').textContent).toMatch(/correct/i);
  });

  test('reportState called with correct distribution shape and updates on toggle', () => {
    render(<OutOfDistributionFailure />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'OutOfDistributionFailure',
      expect.objectContaining({ distribution: 'in' }),
    );
    fireEvent.click(screen.getByTestId('toggle-out'));
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'OutOfDistributionFailure',
      expect.objectContaining({ distribution: 'out' }),
    );
    // verdict should now say unrelated
    expect(screen.getByTestId('verdict').textContent).toMatch(/unrelated/i);
  });
});
