import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getDueCards } from '../lib/srs';
import styles from './Nav.module.css';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function Nav() {
    const dueCount = getDueCards().length;
    return (_jsxs("nav", { className: styles.nav, children: [_jsx("span", { className: styles.brand, children: "RAG Textbook" }), _jsx("a", { href: `${BASE}/`, className: styles.link, children: "Chapters" }), _jsx("a", { href: `${BASE}/review`, className: styles.link, children: "Review" }), dueCount > 0 && _jsxs("span", { className: styles.badge, children: [dueCount, " due"] })] }));
}
