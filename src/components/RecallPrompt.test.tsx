import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallPrompt } from './RecallPrompt';
import * as srs from '../lib/srs';
import * as stateFile from '../lib/stateFile';

vi.mock('../lib/srs');
vi.mock('../lib/stateFile');

describe('RecallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  test('renders question and answer textarea', () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
    expect(screen.getByText('Explain X.')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('submitting answer posts pendingAnswers[concept] to state-writer', async () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
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
    expect(body.pendingAnswers.c1).toEqual(
      expect.objectContaining({ concept: 'c1', answer: 'My answer', question: 'Explain X.' }),
    );
  });

  test('commit clears only its own concept from pendingAnswers / pendingGrades', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => { subCb = cb; return () => {}; });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c1', rating: 3, comment: '' });
    (fetch as any).mockClear();
    await userEvent.click(await screen.findByRole('button', { name: /commit to sr/i }));
    const lastCall = (fetch as any).mock.calls.slice(-1)[0];
    const body = JSON.parse(lastCall[1].body);
    expect(body.pendingAnswers).toEqual({ c1: null });
    expect(body.pendingGrades).toEqual({ c1: null });
  });

  test('after submit, instructs user to run /quiz in Claude Code', async () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/run.*\/quiz.*claude code/i)).toBeInTheDocument();
  });

  test('when pendingGrade arrives, shows commit-to-SR button', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => {
      subCb = cb;
      return () => {};
    });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c1', rating: 3, comment: 'Good answer.' });
    expect(await screen.findByRole('button', { name: /commit to sr/i })).toBeInTheDocument();
    expect(screen.getByText(/good answer/i)).toBeInTheDocument();
  });

  test('clicking commit-to-SR calls createCard then gradeCard', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => { subCb = cb; return () => {}; });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c1', rating: 4, comment: '' });
    await userEvent.click(await screen.findByRole('button', { name: /commit to sr/i }));
    expect(srs.createCard).toHaveBeenCalledWith('c1', 'Q');
    expect(srs.gradeCard).toHaveBeenCalledWith('c1', 4);
  });

  test('ignores pendingGrade for a different concept', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => { subCb = cb; return () => {}; });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c2', rating: 4, comment: '' });
    expect(screen.queryByRole('button', { name: /commit to sr/i })).not.toBeInTheDocument();
  });
});
