// src/lib/content.ts
import graph from '@content/learning-graph.json';
export function loadLearningGraph() {
    return graph;
}
export function getConcept(id) {
    const c = graph.concepts[id];
    return c ? { id, ...c } : null;
}
export function getReadyToStudyConcepts(completed) {
    return Object.entries(graph.concepts)
        .filter(([id, c]) => !completed.has(id) && c.prerequisites.every(p => completed.has(p)))
        .map(([id, c]) => ({ id, ...c }));
}
