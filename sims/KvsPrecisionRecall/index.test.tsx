import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KvsPrecisionRecall } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('KvsPrecisionRecall', () => {
  test('renders with testid root', () => {
    render(<KvsPrecisionRecall />);
    expect(screen.getByTestId('kvs-precision-recall')).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<KvsPrecisionRecall />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'KvsPrecisionRecall',
      expect.objectContaining({
        selectedK: expect.any(Number),
        precision: expect.any(Number),
        recall: expect.any(Number),
        crossoverPoint: expect.any(Number),
      }),
    );
  });
});
