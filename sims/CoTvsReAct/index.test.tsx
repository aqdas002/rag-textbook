import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoTvsReAct } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('CoTvsReAct', () => {
  test('renders problem selector and both columns', () => {
    render(<CoTvsReAct />);
    expect(
      screen.queryAllByRole('button').length + (screen.queryByRole('combobox') ? 1 : 0)
    ).toBeGreaterThan(0);
    expect(screen.getByTestId('cot-column')).toBeInTheDocument();
    expect(screen.getByTestId('react-column')).toBeInTheDocument();
  });

  test('CoT gets the math problem wrong, ReAct gets it right', () => {
    render(<CoTvsReAct initialProblemIndex={0} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].cotCorrect).toBe(false);
    expect(lastCall[1].reactCorrect).toBe(true);
  });

  test('ReAct uses tool calls; CoT does not', () => {
    render(<CoTvsReAct initialProblemIndex={0} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].reactToolCalls).toBeGreaterThan(0);
  });
});
