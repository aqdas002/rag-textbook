import { jsx as _jsx } from "react/jsx-runtime";
// src/components/PredictGate.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictGate } from './PredictGate';
describe('PredictGate', () => {
    test('hides children behind overlay until prediction submitted', async () => {
        render(_jsx(PredictGate, { concept: "c1", question: "What will happen?", children: _jsx("div", { "data-testid": "sim", children: "SIM" }) }));
        expect(screen.getByText('What will happen?')).toBeInTheDocument();
        expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
    });
    test('submitting prediction unlocks the sim and shows the prediction', async () => {
        render(_jsx(PredictGate, { concept: "c1", question: "What will happen?", children: _jsx("div", { "data-testid": "sim", children: "SIM" }) }));
        await userEvent.type(screen.getByRole('textbox'), 'Big chunks lose precision');
        await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
        expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'false');
        expect(screen.getByText(/big chunks lose precision/i)).toBeInTheDocument();
    });
    test('requires a non-empty prediction to unlock', async () => {
        render(_jsx(PredictGate, { concept: "c1", question: "What will happen?", children: _jsx("div", { "data-testid": "sim", children: "SIM" }) }));
        await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
        expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
    });
});
