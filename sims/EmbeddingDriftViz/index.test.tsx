import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmbeddingDriftViz } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('EmbeddingDriftViz', () => {
  test('renders with testid root and key elements', () => {
    render(<EmbeddingDriftViz />);
    expect(screen.getByTestId('embedding-drift-viz')).toBeInTheDocument();
    expect(screen.getByTestId('mix-panel')).toBeInTheDocument();
    expect(screen.getByTestId('migration-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('mix-result-word')).toBeInTheDocument();
  });

  test('reportState called with correct showingMigrationPlan shape', () => {
    render(<EmbeddingDriftViz />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EmbeddingDriftViz',
      expect.objectContaining({ showingMigrationPlan: false }),
    );
    fireEvent.click(screen.getByTestId('migration-toggle'));
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EmbeddingDriftViz',
      expect.objectContaining({ showingMigrationPlan: true }),
    );
  });
});
