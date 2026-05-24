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
];

export function getChapter(id: string): ChapterMeta | undefined {
  return chapters.find(c => c.id === id);
}
