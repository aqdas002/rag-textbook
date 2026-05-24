import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HyDEvsRaw } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('HyDEvsRaw', () => {
  test('renders query selector and both retrieval panels', () => {
    render(<HyDEvsRaw />);
    expect(
      screen.queryByRole('combobox') || screen.queryAllByRole('button').length > 0
    ).toBeTruthy();
    expect(screen.getByTestId('raw-panel')).toBeInTheDocument();
    expect(screen.getByTestId('hyde-panel')).toBeInTheDocument();
  });

  test('HyDE produces a quality lift for the postgres query', () => {
    // Query 0 = postgres slow query — HyDE should win
    render(<HyDEvsRaw initialQueryIndex={0} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].qualityLift).toBeGreaterThan(0);
    expect(lastCall[1].hydeCorrectRank).toBeLessThan(lastCall[1].rawCorrectRank);
  });

  test('HyDE adds cost regardless of whether it helps quality', () => {
    // Query 2 = SKU lookup — HyDE doesn't help
    render(<HyDEvsRaw initialQueryIndex={2} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].qualityLift).toBe(0);
    expect(lastCall[1].hyDeAddedCostUSD).toBeGreaterThan(0);
  });
});
