import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EncoderPipeline } from './index';
import * as reportStateModule from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('EncoderPipeline', () => {
  test('renders with testid root', () => {
    render(<EncoderPipeline />);
    expect(screen.getByTestId('encoder-pipeline')).toBeInTheDocument();
  });

  test('reportState called with activeStage shape; updates on stage click', async () => {
    const user = userEvent.setup();
    render(<EncoderPipeline />);
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EncoderPipeline',
      expect.objectContaining({ activeStage: 'none' }),
    );

    await user.click(screen.getByTestId('stage-tokenizer'));
    expect(reportStateModule.reportState).toHaveBeenCalledWith(
      'EncoderPipeline',
      expect.objectContaining({ activeStage: 'tokenizer' }),
    );
  });
});
