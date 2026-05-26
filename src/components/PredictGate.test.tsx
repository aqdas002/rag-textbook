// src/components/PredictGate.test.tsx
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictGate } from './PredictGate';
import { setPreference, _resetForTests } from '../lib/preferences';

beforeEach(() => {
  localStorage.clear();
  _resetForTests();
  // Enable predict-first so gate behavior is exercised
  setPreference('predictFirst', true);
});

describe('PredictGate', () => {
  test('hides children behind overlay until prediction submitted', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    expect(screen.getByText('What will happen?')).toBeInTheDocument();
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
  });

  test('submitting prediction unlocks the sim and shows the prediction', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    await userEvent.type(screen.getByRole('textbox'), 'Big chunks lose precision');
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'false');
    expect(screen.getByText(/big chunks lose precision/i)).toBeInTheDocument();
  });

  test('requires a non-empty prediction to unlock', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
  });
});
