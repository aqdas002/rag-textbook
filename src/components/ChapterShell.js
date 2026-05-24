import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Nav } from './Nav';
import styles from './ChapterShell.module.css';
export function ChapterShell({ title, children }) {
    return (_jsxs("div", { className: styles.shell, children: [_jsx(Nav, {}), _jsxs("main", { className: styles.main, children: [_jsx("h1", { children: title }), children] })] }));
}
