import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentErrorRecovery } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('AgentErrorRecovery', () => {
  test('renders scenario selector, strategy toggle, and trace', () => {
    render(<AgentErrorRecovery />);
    // Selectors
    expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
    // At least one step card rendered
    expect(screen.getAllByTestId(/^step-/).length).toBeGreaterThanOrEqual(1);
  });

  test('naive retry on side-effecting tool causes double charge', () => {
    // Scenario 2 (index 2 = side-effecting), strategy: naive
    render(<AgentErrorRecovery initialScenarioIndex={2} initialStrategy="naive" />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].sideEffects).toBeGreaterThanOrEqual(1);
  });

  test('production-grade strategy fails fast on permanent error', () => {
    // Scenario 1 (index 1 = permanent 400), strategy: production
    render(<AgentErrorRecovery initialScenarioIndex={1} initialStrategy="production" />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].totalAttempts).toBe(1);
    expect(lastCall[1].finalOutcome).toMatch(/fail/i);
  });
});
