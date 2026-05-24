import { useEffect, useState } from 'react';
import { Chapter } from './Chapter';
import { Review } from './Review';
import { Index } from './Index';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (path === '/review') return <Review />;

  const chapterMatch = path.match(/^\/chapters\/([a-z0-9-]+)\/?$/);
  if (chapterMatch) return <Chapter chapterId={chapterMatch[1]!} />;

  return <Index />;
}
