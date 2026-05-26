import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitterLevels } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('SplitterLevels', () => {
  test('renders with testid root and level buttons', () => {
    render(<SplitterLevels />);
    expect(screen.getByTestId('splitter-levels')).toBeInTheDocument();
    // Should have 5 level buttons
    const group = screen.getByRole('group', { name: /splitter level/i });
    expect(group.querySelectorAll('button')).toHaveLength(5);
  });

  test('reportState called with activeLevel and chunkCount on first render', () => {
    render(<SplitterLevels />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'SplitterLevels',
      expect.objectContaining({
        activeLevel: 1,
        chunkCount: expect.any(Number),
        semanticAligned: expect.any(Boolean),
      }),
    );
  });
});
