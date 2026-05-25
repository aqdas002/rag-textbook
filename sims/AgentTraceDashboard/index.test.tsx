import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentTraceDashboard } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('AgentTraceDashboard', () => {
  test('renders summary panel, filter controls, and trace list', () => {
    render(<AgentTraceDashboard />);
    expect(screen.getByTestId('summary-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^trace-row-/).length).toBeGreaterThanOrEqual(1);
    // Filter buttons or dropdown
    expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
  });

  test('filtering to failures-only reduces displayed count and changes success rate to 0', async () => {
    render(<AgentTraceDashboard />);
    await userEvent.click(screen.getByRole('button', { name: /failures only/i }));
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].successRate).toBe(0);
    expect(lastCall[1].displayedCount).toBeLessThan(8);
  });

  test('p99 cost is at least 5x median cost (outlier scenario)', () => {
    render(<AgentTraceDashboard />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].p99Cost / lastCall[1].medianCost).toBeGreaterThanOrEqual(5);
  });
});
