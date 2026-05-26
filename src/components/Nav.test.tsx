import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nav } from './Nav';
import * as srs from '../lib/srs';
import { _resetForTests } from '../lib/preferences';

vi.mock('../lib/srs');

describe('Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    _resetForTests();
    (srs.getDueCards as any).mockReturnValue([]);
  });

  test('shows due-count badge when cards are due', () => {
    (srs.getDueCards as any).mockReturnValue([{ concept: 'c1' }, { concept: 'c2' }]);
    render(<Nav />);
    expect(screen.getByText(/2 due/i)).toBeInTheDocument();
  });

  test('hides badge when no cards due', () => {
    render(<Nav />);
    expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
  });

  test('predict-first toggle flips the preference', async () => {
    localStorage.clear();
    render(<Nav />);
    const btn = screen.getByTestId('predict-first-toggle');
    expect(btn).toHaveTextContent(/off/i);
    await userEvent.click(btn);
    expect(btn).toHaveTextContent(/on/i);
  });
});
