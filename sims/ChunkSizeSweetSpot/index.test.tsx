import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChunkSizeSweetSpot } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ChunkSizeSweetSpot', () => {
  test('renders chart with testid root and slider', () => {
    render(<ChunkSizeSweetSpot />);
    expect(screen.getByTestId('chunk-size-sweet-spot')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /chunk size/i })).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<ChunkSizeSweetSpot />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'ChunkSizeSweetSpot',
      expect.objectContaining({
        selectedSize: 512,
        qualityAtSelected: expect.any(Number),
        inSweetSpot: true,
      }),
    );
  });
});
