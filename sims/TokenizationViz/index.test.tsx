import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TokenizationViz } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('TokenizationViz', () => {
  test('renders with testid root and language buttons', () => {
    render(<TokenizationViz />);
    expect(screen.getByTestId('tokenization-viz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /english/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chinese/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /python/i })).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<TokenizationViz />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'TokenizationViz',
      expect.objectContaining({
        language: 'english',
        tokenCount: expect.any(Number),
        charCount: expect.any(Number),
        charsPerToken: expect.any(Number),
      }),
    );
  });
});
