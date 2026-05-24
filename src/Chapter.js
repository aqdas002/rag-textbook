import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { ChapterShell } from './components';
import { getChapter } from './lib/chapters';
export function Chapter({ chapterId }) {
    const chapter = getChapter(chapterId);
    if (!chapter) {
        return (_jsxs(ChapterShell, { title: "Not found", children: [_jsxs("p", { children: ["No chapter with id \"", chapterId, "\"."] }), _jsx("p", { children: _jsx("a", { href: "/", children: "Back to chapters" }) })] }));
    }
    const { title, Component } = chapter;
    return (_jsx(ChapterShell, { title: title, children: _jsx(Suspense, { fallback: _jsx("p", { children: "Loading\u2026" }), children: _jsx(Component, {}) }) }));
}
