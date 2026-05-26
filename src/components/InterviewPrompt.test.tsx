import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewPrompt } from './InterviewPrompt';
import * as srs from '../lib/srs';
import * as stateFile from '../lib/stateFile';

vi.mock('../lib/srs');
vi.mock('../lib/stateFile');

describe('InterviewPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  test('renders scenario, question, and the show-solution button (solution hidden initially)', () => {
    render(
      <InterviewPrompt
        concept="chunk-size-tradeoff"
        scenario="A customer complains the bot says it does not know."
        question="What are the first three things you would check?"
      >
        <p>The canonical solution.</p>
      </InterviewPrompt>,
    );
    expect(screen.getByText('A customer complains the bot says it does not know.')).toBeInTheDocument();
    expect(screen.getByText('What are the first three things you would check?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show solution walkthrough/i })).toBeInTheDocument();
    expect(screen.queryByText('The canonical solution.')).not.toBeInTheDocument();
  });

  test('clicking show-solution reveals the walkthrough children', async () => {
    render(
      <InterviewPrompt
        concept="chunk-size-tradeoff"
        scenario="Scenario text."
        question="The question."
      >
        <p>The canonical solution.</p>
      </InterviewPrompt>,
    );
    await userEvent.click(screen.getByRole('button', { name: /show solution walkthrough/i }));
    expect(screen.getByText('The canonical solution.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide solution/i })).toBeInTheDocument();
  });

  test('submitting answer follows the same pendingAnswer POST shape as RecallPrompt', async () => {
    render(
      <InterviewPrompt
        concept="chunk-size-tradeoff"
        scenario="Scenario text."
        question="The question to answer."
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'My answer');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5174/state',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.pendingAnswers).toBeDefined();
    expect(body.pendingAnswers['chunk-size-tradeoff']).toEqual(
      expect.objectContaining({
        concept: 'chunk-size-tradeoff',
        answer: 'My answer',
        question: 'The question to answer.',
      }),
    );
  });
});
