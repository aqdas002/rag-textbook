import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LostInTheMiddle } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('LostInTheMiddle', () => {
  test('renders with testid root', () => {
    render(<LostInTheMiddle />);
    expect(screen.getByTestId('lost-in-the-middle')).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<LostInTheMiddle />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'LostInTheMiddle',
      expect.objectContaining({
        position: expect.any(Number),
        correctnessPct: expect.any(Number),
      }),
    );
  });
});
