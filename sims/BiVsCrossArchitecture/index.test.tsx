import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BiVsCrossArchitecture } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('BiVsCrossArchitecture', () => {
  test('renders with testid root and both panels', () => {
    render(<BiVsCrossArchitecture />);
    expect(screen.getByTestId('bi-vs-cross-architecture')).toBeInTheDocument();
    expect(screen.getByTestId('bi-encoder-panel')).toBeInTheDocument();
    expect(screen.getByTestId('cross-encoder-panel')).toBeInTheDocument();
  });

  test('reportState called with { rendered: true } on mount', () => {
    render(<BiVsCrossArchitecture />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'BiVsCrossArchitecture',
      expect.objectContaining({ rendered: true }),
    );
  });
});
