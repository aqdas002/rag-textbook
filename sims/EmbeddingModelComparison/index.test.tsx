import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbeddingModelComparison } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('EmbeddingModelComparison', () => {
  test('renders with testid root', () => {
    render(<EmbeddingModelComparison />);
    expect(screen.getByTestId('embedding-model-comparison')).toBeInTheDocument();
  });

  test('reportState called with modelCount: 6', () => {
    render(<EmbeddingModelComparison />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EmbeddingModelComparison',
      expect.objectContaining({ modelCount: 6 }),
    );
  });
});
