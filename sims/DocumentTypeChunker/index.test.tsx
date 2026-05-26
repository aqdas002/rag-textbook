import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentTypeChunker } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('DocumentTypeChunker', () => {
  test('renders with testid root and doc type buttons', () => {
    render(<DocumentTypeChunker />);
    expect(screen.getByTestId('document-type-chunker')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /markdown/i })).toBeInTheDocument();
    expect(screen.getByTestId('corruption-callout')).toBeInTheDocument();
  });

  test('reportState called with correct shape on first render', () => {
    render(<DocumentTypeChunker />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'DocumentTypeChunker',
      expect.objectContaining({
        docType: 'code',
        chunkCount: expect.any(Number),
      }),
    );
  });
});
