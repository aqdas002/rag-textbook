import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimilarityScorer } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('SimilarityScorer', () => {
  test('renders two phrase inputs', () => {
    render(<SimilarityScorer />);
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('similar phrases get high similarity, dissimilar get low', () => {
    render(<SimilarityScorer initialA="king queen prince" initialB="crown royalty kingdom" />);
    const lastCallHigh = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCallHigh[1].similarity).toBeGreaterThan(0.5);

    (reportState.reportState as any).mockClear();
    render(<SimilarityScorer initialA="king queen" initialB="pizza burger" />);
    const lastCallLow = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCallLow[1].similarity).toBeLessThan(0.3);
  });

  test('reports recognized words for each phrase', () => {
    render(<SimilarityScorer initialA="the king sleeps" initialB="a cat purrs" />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].recognizedA).toContain('king');
    expect(lastCall[1].recognizedB).toContain('cat');
  });
});
