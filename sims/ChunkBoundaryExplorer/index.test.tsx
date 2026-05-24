import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChunkBoundaryExplorer } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ChunkBoundaryExplorer', () => {
  test('renders text and chunk-size slider', () => {
    render(<ChunkBoundaryExplorer initialChunkSize={128} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/chunk size/i)).toBeInTheDocument();
  });

  test('changing slider reports state via reportState', async () => {
    render(<ChunkBoundaryExplorer initialChunkSize={128} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '256' } });
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'ChunkBoundaryExplorer',
      expect.objectContaining({ chunkSize: 256 }),
    );
  });

  test('chunk count = ceil(text_length / chunk_size)', () => {
    render(<ChunkBoundaryExplorer initialChunkSize={100} textLength={350} />);
    // "4" is in a <strong> and " chunks from a..." is a text node sibling —
    // target only the <p> element whose full textContent includes "4 chunks".
    expect(
      screen.getByText((_content, element) => {
        return element?.tagName === 'P' &&
          (element.textContent ?? '').toLowerCase().includes('4 chunks');
      }),
    ).toBeInTheDocument();
  });
});
