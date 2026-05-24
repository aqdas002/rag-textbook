import { lazy, ComponentType, LazyExoticComponent } from 'react';

export interface ChapterMeta {
  id: string;
  title: string;
  order: number;
  blurb: string;
  Component: LazyExoticComponent<ComponentType>;
}

export const chapters: ChapterMeta[] = [
  {
    id: 'chunking',
    title: 'Chunking',
    order: 1,
    blurb: 'How documents get carved into pieces, and why the carve points matter more than they look.',
    Component: lazy(() => import('../../content/chapters/01-chunking.mdx')),
  },
  {
    id: 'embeddings',
    title: 'Embeddings',
    order: 2,
    blurb: 'How chunks become vectors, and what "similar" means once they do.',
    Component: lazy(() => import('../../content/chapters/02-embeddings.mdx')),
  },
  {
    id: 'retrieval',
    title: 'Retrieval',
    order: 3,
    blurb: 'Picking the top-K, and why "most relevant" and "most useful" are not the same thing.',
    Component: lazy(() => import('../../content/chapters/03-retrieval.mdx')),
  },
  {
    id: 'reranking',
    title: 'Reranking',
    order: 4,
    blurb: 'The two-stage pattern that most production RAG systems use. Bi-encoder for recall, cross-encoder for precision.',
    Component: lazy(() => import('../../content/chapters/04-reranking.mdx')),
  },
  {
    id: 'hybrid-search',
    title: 'Hybrid search',
    order: 5,
    blurb: 'BM25 and dense retrieval fail in different ways. The combination recovers most of what either alone misses.',
    Component: lazy(() => import('../../content/chapters/05-hybrid-search.mdx')),
  },
  {
    id: 'evals',
    title: 'Evals',
    order: 6,
    blurb: 'You cannot improve what you cannot measure. The metrics, the eval set, and the LLM-as-judge pattern.',
    Component: lazy(() => import('../../content/chapters/06-evals.mdx')),
  },
  {
    id: 'graph-rag',
    title: 'GraphRAG',
    order: 7,
    blurb: 'When vanilla similarity retrieval cannot connect facts across documents. Knowledge graphs + traversal as an alternative.',
    Component: lazy(() => import('../../content/chapters/07-graph-rag.mdx')),
  },
  {
    id: 'agentic-rag',
    title: 'Agentic RAG',
    order: 8,
    blurb: 'When one retrieval call is not enough. The LLM decides what to look up next based on what it has already seen.',
    Component: lazy(() => import('../../content/chapters/08-agentic-rag.mdx')),
  },
  {
    id: 'production',
    title: 'Production',
    order: 9,
    blurb: 'Caching, latency budgets, cost management, observability, drift. The operational concerns that separate demos from production systems.',
    Component: lazy(() => import('../../content/chapters/09-production.mdx')),
  },
  {
    id: 'query-transformation',
    title: 'Query transformation',
    order: 10,
    blurb: 'When the user query is not the right query to embed. Rewriting, HyDE, sub-query fusion, and routing.',
    Component: lazy(() => import('../../content/chapters/10-query-transformation.mdx')),
  },
];

export function getChapter(id: string): ChapterMeta | undefined {
  return chapters.find(c => c.id === id);
}
