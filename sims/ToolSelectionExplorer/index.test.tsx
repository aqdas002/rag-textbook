import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolSelectionExplorer } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ToolSelectionExplorer', () => {
  test('renders schema-quality toggle, query selector, and toolbox', () => {
    render(<ToolSelectionExplorer />);
    // Tools listed
    expect(screen.getAllByTestId(/^tool-card-/).length).toBe(4);
    // Some kind of selector
    expect(
      screen.queryAllByRole('button').length + screen.queryAllByRole('checkbox').length + screen.queryAllByRole('radio').length
    ).toBeGreaterThan(0);
  });

  test('parallel-opportunity query triggers parallel tool calls under good schemas', () => {
    // Default state: good schemas, parallel query (index 3)
    render(<ToolSelectionExplorer initialSchemaQuality="good" initialQueryIndex={3} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].didParallel).toBe(true);
    expect(lastCall[1].selectedTools.length).toBeGreaterThanOrEqual(2);
  });

  test('bad schemas hallucinate arguments on the missing-context query', () => {
    // Bad schemas, query 2 (book cheapest)
    render(<ToolSelectionExplorer initialSchemaQuality="bad" initialQueryIndex={2} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].outcome).toMatch(/hallucinated|wrong/i);
  });
});
