import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbeddingPipelineFlow } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('EmbeddingPipelineFlow', () => {
  test('renders with testid root, detail panel, and key stage buttons', () => {
    render(<EmbeddingPipelineFlow />);
    expect(screen.getByTestId('embedding-pipeline-flow')).toBeInTheDocument();
    expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
    expect(screen.getByTestId('stage-idx-chunks')).toBeInTheDocument();
    expect(screen.getByTestId('stage-idx-embed')).toBeInTheDocument();
    expect(screen.getByTestId('stage-idx-vector-db')).toBeInTheDocument();
    expect(screen.getByTestId('stage-qry-query')).toBeInTheDocument();
    expect(screen.getByTestId('stage-qry-ann')).toBeInTheDocument();
  });

  test('reportState called with activeStage: null on first render', () => {
    render(<EmbeddingPipelineFlow />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EmbeddingPipelineFlow',
      expect.objectContaining({ activeStage: null }),
    );
  });
});
