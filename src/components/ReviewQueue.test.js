import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewQueue } from './ReviewQueue';
import * as srs from '../lib/srs';
vi.mock('../lib/srs');
describe('ReviewQueue', () => {
    beforeEach(() => vi.clearAllMocks());
    test('shows "no reviews due" when empty', () => {
        srs.getDueCards.mockReturnValue([]);
        render(_jsx(ReviewQueue, {}));
        expect(screen.getByText(/no reviews due/i)).toBeInTheDocument();
    });
    test('shows count + first card prompt when cards due', () => {
        srs.getDueCards.mockReturnValue([
            { concept: 'c1', prompt: 'Q1', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
            { concept: 'c2', prompt: 'Q2', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
        ]);
        render(_jsx(ReviewQueue, {}));
        expect(screen.getByText(/2 reviews due/i)).toBeInTheDocument();
        expect(screen.getByText('Q1')).toBeInTheDocument();
    });
    test('renders a RecallPrompt for the first due card', () => {
        srs.getDueCards.mockReturnValue([
            { concept: 'c1', prompt: 'Q1', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
        ]);
        render(_jsx(ReviewQueue, {}));
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
});
