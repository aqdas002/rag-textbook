// src/App.tsx
import { useEffect, useState } from 'react';
import { Chapter } from './Chapter';
import { Review } from './Review';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  if (path === '/review') return <Review />;
  return <Chapter />;
}
