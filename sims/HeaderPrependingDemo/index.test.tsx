import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeaderPrependingDemo } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('HeaderPrependingDemo', () => {
  test('renders with testid root and toggle button', () => {
    render(<HeaderPrependingDemo />);
    expect(screen.getByTestId('header-prepending-demo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show llm/i })).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<HeaderPrependingDemo />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'HeaderPrependingDemo',
      expect.objectContaining({
        showingLLM: false,
        withoutHeaderRetrieved: false,
        withHeaderRetrieved: true,
      }),
    );
  });
});
