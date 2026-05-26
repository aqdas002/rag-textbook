import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type Language = 'english' | 'chinese' | 'python';

interface TokenData {
  tokens: string[];
  charCount: number;
}

// Hardcoded fake tokenizer output that mimics tiktoken behavior
const TOKENIZER_DATA: Record<Language, TokenData> = {
  english: {
    tokens: [
      'The', ' cat', ' sat', ' on', ' the', ' mat', '.', ' The', ' dog', ' ran',
      ' in', ' the', ' park', '.',
    ],
    charCount: 49,
  },
  chinese: {
    tokens: [
      '猫', '坐', '在', '垫', '子', '上', '。', '狗', '在', '公', '园', '里', '跑', '。',
    ],
    charCount: 14,
  },
  python: {
    tokens: [
      'def', ' parse', '_json', '(', 's', ':', ' str', ')', ' ->', ' dict', ':',
      '\n', '    ', 'return', ' json', '.', 'loads', '(', 's', ')',
    ],
    charCount: 55,
  },
};

const SENTENCES: Record<Language, string> = {
  english: 'The cat sat on the mat. The dog ran in the park.',
  chinese: '猫坐在垫子上。狗在公园里跑。',
  python: 'def parse_json(s: str) -> dict:\n    return json.loads(s)',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  english: 'English',
  chinese: 'Chinese',
  python: 'Python',
};

const TOKEN_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#9333ea', '#0284c7', '#047857', '#b45309',
  '#be123c', '#6d28d9', '#1d4ed8', '#065f46', '#92400e',
  '#9f1239', '#5b21b6', '#1e40af', '#064e3b', '#78350f',
];

export function TokenizationViz() {
  const [language, setLanguage] = useState<Language>('english');

  const data = TOKENIZER_DATA[language];
  const tokenCount = data.tokens.length;
  const charCount = data.charCount;
  const charsPerToken = parseFloat((charCount / tokenCount).toFixed(2));
  const charsIn500Tokens = Math.round(500 * charsPerToken);

  useEffect(() => {
    reportState('TokenizationViz', { language, tokenCount, charCount, charsPerToken });
  }, [language, tokenCount, charCount, charsPerToken]);

  return (
    <div className={styles.sim} data-testid="tokenization-viz">
      <div className={styles.selector} role="group" aria-label="Language">
        {(['english', 'chinese', 'python'] as Language[]).map(lang => (
          <button
            key={lang}
            className={`${styles.langBtn} ${language === lang ? styles.active : ''}`}
            onClick={() => setLanguage(lang)}
            aria-pressed={language === lang}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      <div className={styles.sentenceBox}>
        <span className={styles.sentenceLabel}>Input sentence</span>
        <code className={styles.sentence}>{SENTENCES[language]}</code>
      </div>

      <div className={styles.tokensLabel}>Tokens ({tokenCount})</div>
      <div className={styles.tokenBlocks} data-testid="token-blocks">
        {data.tokens.map((tok, i) => (
          <span
            key={i}
            className={styles.token}
            style={{
              background: `${TOKEN_COLORS[i % TOKEN_COLORS.length]}18`,
              borderColor: TOKEN_COLORS[i % TOKEN_COLORS.length],
              color: TOKEN_COLORS[i % TOKEN_COLORS.length],
            }}
          >
            {tok === '\n' ? '↵' : tok === '    ' ? '→→→→' : tok}
          </span>
        ))}
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{charCount}</span>
          <span className={styles.statLabel}>characters</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{tokenCount}</span>
          <span className={styles.statLabel}>tokens</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{charsPerToken}</span>
          <span className={styles.statLabel}>chars / token</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>~{charsIn500Tokens.toLocaleString()}</span>
          <span className={styles.statLabel}>chars in 500 tokens</span>
        </div>
      </div>

      <p className={styles.caption}>
        500 tokens ≈ {charsIn500Tokens.toLocaleString()} characters in{' '}
        {LANGUAGE_LABELS[language]}. Token budgets translate to very different character
        counts across languages — a chunk_size that works for English prose can silently
        under-fill or over-fill chunks in {LANGUAGE_LABELS[language]}.
      </p>
    </div>
  );
}
