import { Suspense } from 'react';
import { ChapterShell } from './components';
import { getChapter } from './lib/chapters';

interface Props {
  chapterId: string;
}

export function Chapter({ chapterId }: Props) {
  const chapter = getChapter(chapterId);
  if (!chapter) {
    return (
      <ChapterShell title="Not found">
        <p>No chapter with id "{chapterId}".</p>
        <p><a href="/">Back to chapters</a></p>
      </ChapterShell>
    );
  }
  const { title, Component } = chapter;
  return (
    <ChapterShell title={title}>
      <Suspense fallback={<p>Loading…</p>}>
        <Component />
      </Suspense>
    </ChapterShell>
  );
}
