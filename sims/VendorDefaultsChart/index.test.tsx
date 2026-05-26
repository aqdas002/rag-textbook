import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorDefaultsChart } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('VendorDefaultsChart', () => {
  test('renders chart with testid root', () => {
    render(<VendorDefaultsChart />);
    expect(screen.getByTestId('vendor-defaults-chart')).toBeInTheDocument();
  });

  test('reportState called with vendorCount: 5 on first render', () => {
    render(<VendorDefaultsChart />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'VendorDefaultsChart',
      expect.objectContaining({ vendorCount: 5 }),
    );
  });
});
