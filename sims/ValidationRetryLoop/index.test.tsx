import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationRetryLoop } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ValidationRetryLoop', () => {
  test('renders scenario selector and validation trace', () => {
    render(<ValidationRetryLoop />);
    // Some kind of selector — buttons or combobox
    expect(
      screen.queryAllByRole('button').length + (screen.queryByRole('combobox') ? 1 : 0)
    ).toBeGreaterThan(0);
    // At least one attempt shown
    expect(screen.getAllByTestId(/^attempt-/).length).toBeGreaterThanOrEqual(1);
  });

  test('strict mode scenario passes in 1 attempt', () => {
    render(<ValidationRetryLoop initialScenarioIndex={0} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].totalAttempts).toBe(1);
    expect(lastCall[1].finalOutcome).toBe('passed');
  });

  test('weaker-model scenario takes 3 attempts and costs ~3x strict scenario', () => {
    render(<ValidationRetryLoop initialScenarioIndex={3} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].totalAttempts).toBe(3);
    expect(lastCall[1].totalCallsUSD).toBeCloseTo(0.015, 3);
  });
});
