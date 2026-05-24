// src/lib/content.ts
import graph from '@content/learning-graph.json';

export interface Concept {
  id: string;
  title: string;
  prerequisites: string[];
  chapter: string;
  section: string;
}

export interface LearningGraph {
  version: 1;
  concepts: Record<string, Omit<Concept, 'id'>>;
}

export function loadLearningGraph(): LearningGraph {
  return graph as LearningGraph;
}

export function getConcept(id: string): Concept | null {
  const c = graph.concepts[id as keyof typeof graph.concepts];
  return c ? { id, ...c } : null;
}

export function getReadyToStudyConcepts(completed: Set<string>): Concept[] {
  return Object.entries(graph.concepts)
    .filter(([id, c]) => !completed.has(id) && c.prerequisites.every(p => completed.has(p)))
    .map(([id, c]) => ({ id, ...c }));
}
