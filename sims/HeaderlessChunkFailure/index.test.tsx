import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderlessChunkFailure } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('HeaderlessChunkFailure', () => {
  test('renders with testid root and fix toggle button', () => {
    render(<HeaderlessChunkFailure />);
    expect(screen.getByTestId('headerless-chunk-failure')).toBeInTheDocument();
    expect(screen.getByTestId('fix-toggle')).toBeInTheDocument();
  });

  test('reportState called with headerFixed: false on first render', () => {
    render(<HeaderlessChunkFailure />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'HeaderlessChunkFailure',
      expect.objectContaining({ headerFixed: false }),
    );
  });
});
