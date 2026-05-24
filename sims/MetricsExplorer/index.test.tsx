import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsExplorer } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('MetricsExplorer', () => {
  test('renders 10 doc rows and a K slider', () => {
    render(<MetricsExplorer />);
    expect(screen.getAllByTestId(/^doc-row-/)).toHaveLength(10);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  test('default state: precision@5 = 0.6, recall@5 = 0.75, MRR = 1.0', () => {
    render(<MetricsExplorer />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].k).toBe(5);
    expect(lastCall[1].precisionAtK).toBeCloseTo(0.6, 2);
    expect(lastCall[1].recallAtK).toBeCloseTo(0.75, 2);
    expect(lastCall[1].mrr).toBeCloseTo(1.0, 2);
  });

  test('toggling a relevant doc to irrelevant changes precision@K', async () => {
    render(<MetricsExplorer />);
    const beforeCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    const beforePrecision = beforeCall[1].precisionAtK;
    // Toggle the doc at rank 1 (which is relevant by default) to irrelevant
    await userEvent.click(screen.getByTestId('relevance-toggle-1'));
    const afterCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(afterCall[1].precisionAtK).toBeLessThan(beforePrecision);
  });

  test('nDCG@K is between 0 and 1', () => {
    render(<MetricsExplorer />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].ndcgAtK).toBeGreaterThanOrEqual(0);
    expect(lastCall[1].ndcgAtK).toBeLessThanOrEqual(1);
  });
});
