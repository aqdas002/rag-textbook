import { jsx as _jsx } from "react/jsx-runtime";
// src/Review.tsx
import { ChapterShell, ReviewQueue } from './components';
export function Review() {
    return (_jsx(ChapterShell, { title: "Review", children: _jsx(ReviewQueue, {}) }));
}
