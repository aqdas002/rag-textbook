import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChunkingPipelineFlow } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ChunkingPipelineFlow', () => {
  test('renders with testid root and all 6 stage buttons', () => {
    render(<ChunkingPipelineFlow />);
    expect(screen.getByTestId('chunking-pipeline-flow')).toBeInTheDocument();
    expect(screen.getByTestId('stage-source')).toBeInTheDocument();
    expect(screen.getByTestId('stage-chunk')).toBeInTheDocument();
    expect(screen.getByTestId('stage-index')).toBeInTheDocument();
    expect(screen.getByTestId('detail-panel')).toBeInTheDocument();
  });

  test('reportState called with activeStage: null on first render', () => {
    render(<ChunkingPipelineFlow />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'ChunkingPipelineFlow',
      expect.objectContaining({ activeStage: null }),
    );
  });
});
