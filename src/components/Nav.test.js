import { jsx as _jsx } from "react/jsx-runtime";
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Nav } from './Nav';
import * as srs from '../lib/srs';
vi.mock('../lib/srs');
describe('Nav', () => {
    beforeEach(() => vi.clearAllMocks());
    test('shows due-count badge when cards are due', () => {
        srs.getDueCards.mockReturnValue([{ concept: 'c1' }, { concept: 'c2' }]);
        render(_jsx(Nav, {}));
        expect(screen.getByText(/2 due/i)).toBeInTheDocument();
    });
    test('hides badge when no cards due', () => {
        srs.getDueCards.mockReturnValue([]);
        render(_jsx(Nav, {}));
        expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
    });
});
