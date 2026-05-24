import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChapterShell } from './components';
import { chapters } from './lib/chapters';
import styles from './Index.module.css';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function Index() {
    return (_jsxs(ChapterShell, { title: "RAG Textbook", children: [_jsxs("p", { className: styles.intro, children: ["An interactive textbook for learning Retrieval-Augmented Generation. Each chapter mixes prose, prediction-first sims, and recall prompts. Use", ' ', _jsx("code", { children: "claude" }), " in this directory's terminal as your Socratic tutor."] }), _jsx("ol", { className: styles.list, children: chapters.map(c => (_jsxs("li", { className: styles.item, children: [_jsxs("a", { href: `${BASE}/chapters/${c.id}`, className: styles.link, children: [_jsx("span", { className: styles.order, children: String(c.order).padStart(2, '0') }), _jsx("span", { className: styles.title, children: c.title })] }), _jsx("p", { className: styles.blurb, children: c.blurb })] }, c.id))) })] }));
}
