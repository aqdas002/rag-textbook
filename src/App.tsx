import { useEffect, useState } from 'react';
import { Chapter } from './Chapter';
import { Review } from './Review';
import { Index } from './Index';

// Strip the Vite base path from window.location.pathname so client-side
// routing works whether we're hosted at / (local dev) or /<repo>/ (GH Pages).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
function stripBase(p: string): string {
  return BASE && p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p;
}

export default function App() {
  const [path, setPath] = useState(stripBase(window.location.pathname));
  useEffect(() => {
    const handler = () => setPath(stripBase(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (path === '/review') return <Review />;

  const chapterMatch = path.match(/^\/chapters\/([a-z0-9-]+)\/?$/);
  if (chapterMatch) return <Chapter chapterId={chapterMatch[1]!} />;

  return <Index />;
}
