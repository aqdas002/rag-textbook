import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getDueCards } from '../lib/srs';
import { usePreferences, setPreference } from '../lib/preferences';
import styles from './Nav.module.css';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function Nav() {
    const dueCount = getDueCards().length;
    const { predictFirst } = usePreferences();
    return (_jsxs("nav", { className: styles.nav, children: [_jsx("span", { className: styles.brand, children: "RAG Textbook" }), _jsx("a", { href: `${BASE}/`, className: styles.link, children: "Chapters" }), _jsx("a", { href: `${BASE}/review`, className: styles.link, children: "Review" }), _jsx("button", { type: "button", className: predictFirst ? styles.toggleActive : styles.toggle, onClick: () => setPreference('predictFirst', !predictFirst), "aria-pressed": predictFirst, "data-testid": "predict-first-toggle", children: `Predict-first: ${predictFirst ? 'On' : 'Off'}` }), dueCount > 0 && _jsxs("span", { className: styles.badge, children: [dueCount, " due"] })] }));
}
