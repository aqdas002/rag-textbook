import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HNSWvsIVF } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('HNSWvsIVF', () => {
  test('renders with testid root', () => {
    render(<HNSWvsIVF />);
    expect(screen.getByTestId('hnsw-vs-ivf')).toBeInTheDocument();
  });

  test('reportState called with rendered: true on first render', () => {
    render(<HNSWvsIVF />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'HNSWvsIVF',
      expect.objectContaining({ rendered: true }),
    );
  });
});
