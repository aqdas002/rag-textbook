import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AsymmetricPrefix } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('AsymmetricPrefix', () => {
  test('renders with testid root', () => {
    render(<AsymmetricPrefix />);
    expect(screen.getByTestId('asymmetric-prefix')).toBeInTheDocument();
  });

  test('reportState called with correct shape; cosine updates on mode toggle', async () => {
    const user = userEvent.setup();
    render(<AsymmetricPrefix />);

    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'AsymmetricPrefix',
      expect.objectContaining({ mode: 'correct', cosineScore: 0.81 }),
    );

    await user.click(screen.getByTestId('mode-wrong-no-prefix'));
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'AsymmetricPrefix',
      expect.objectContaining({ mode: 'wrong-no-prefix', cosineScore: 0.62 }),
    );
  });
});
