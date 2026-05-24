// src/lib/content.test.ts
import { describe, test, expect } from 'vitest';
import { loadLearningGraph, getConcept, getReadyToStudyConcepts } from './content';
describe('content / learning graph', () => {
    test('loadLearningGraph returns the JSON content', () => {
        const g = loadLearningGraph();
        expect(g.version).toBe(1);
        expect(g.concepts['chunk-size']).toBeDefined();
    });
    test('getConcept returns concept by id', () => {
        const c = getConcept('chunk-overlap');
        expect(c?.title).toBe('Chunk overlap');
        expect(c?.prerequisites).toContain('chunk-size');
    });
    test('getReadyToStudyConcepts returns concepts whose prereqs are all completed', () => {
        const ready = getReadyToStudyConcepts(new Set(['chunk-size']));
        const ids = ready.map(c => c.id);
        expect(ids).toContain('semantic-boundaries');
        expect(ids).toContain('chunk-overlap');
        expect(ids).not.toContain('chunk-size'); // already done
        expect(ids).not.toContain('chunk-retrieval-impact'); // needs overlap
    });
});
