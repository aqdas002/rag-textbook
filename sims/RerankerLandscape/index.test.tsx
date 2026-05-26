import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RerankerLandscape } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('RerankerLandscape', () => {
  test('renders with testid root and all 4 reranker rows', () => {
    render(<RerankerLandscape />);
    expect(screen.getByTestId('reranker-landscape')).toBeInTheDocument();
    expect(screen.getByTestId('reranker-row-cohere-rerank-3')).toBeInTheDocument();
    expect(screen.getByTestId('reranker-row-voyage-rerank-2')).toBeInTheDocument();
    expect(screen.getByTestId('reranker-row-bge-reranker-v2-m3')).toBeInTheDocument();
    expect(screen.getByTestId('reranker-row-jina-reranker-v2')).toBeInTheDocument();
  });

  test('reportState called with { rerankerCount: 4 } on mount', () => {
    render(<RerankerLandscape />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'RerankerLandscape',
      expect.objectContaining({ rerankerCount: 4 }),
    );
  });
});
