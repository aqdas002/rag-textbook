import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmbeddingSpace } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('EmbeddingSpace', () => {
  test('renders all word labels in the scatter plot', () => {
    render(<EmbeddingSpace />);
    expect(screen.getAllByText(/king|queen|cat|dog/i).length).toBeGreaterThan(0);
  });

  test('clicking a word reports state with that word + neighbors', async () => {
    render(<EmbeddingSpace />);
    const kingDot = screen.getByTestId('word-dot-king');
    await userEvent.click(kingDot);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[0]).toBe('EmbeddingSpace');
    expect(lastCall[1].clickedWord).toBe('king');
    expect(Array.isArray(lastCall[1].nearestNeighbors)).toBe(true);
    expect(lastCall[1].nearestNeighbors.length).toBe(5);
  });

  test('cluster purity is high when neighbors are in the same cluster', async () => {
    render(<EmbeddingSpace />);
    const kingDot = screen.getByTestId('word-dot-king');
    await userEvent.click(kingDot);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    // With well-separated clusters, at least 3 of 5 neighbors of "king" should be royalty.
    expect(lastCall[1].clusterPurity).toBeGreaterThanOrEqual(0.6);
  });
});
