import { useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type Verdict = 'win' | 'tie' | 'lose';

interface QueryRow {
  id: string;
  label: string;
  example: string;
  bm25: Verdict;
  dense: Verdict;
  hybrid: Verdict;
}

const ROWS: QueryRow[] = [
  {
    id: 'exact-identifier',
    label: 'Exact identifier',
    example: 'SKU XR-7700-B',
    bm25: 'win', dense: 'lose', hybrid: 'win',
  },
  {
    id: 'error-code',
    label: 'Error code',
    example: 'E_AUTH_4096',
    bm25: 'win', dense: 'lose', hybrid: 'win',
  },
  {
    id: 'synonym',
    label: 'Synonym / paraphrase',
    example: 'how do I get my money back',
    bm25: 'lose', dense: 'win', hybrid: 'win',
  },
  {
    id: 'multi-keyword',
    label: 'Multi-keyword common',
    example: 'user account settings',
    bm25: 'tie', dense: 'tie', hybrid: 'win',
  },
  {
    id: 'multi-faceted',
    label: 'Multi-faceted',
    example: 'compare X and Y',
    bm25: 'lose', dense: 'tie', hybrid: 'win',
  },
];

const SYMBOLS: Record<Verdict, string> = { win: '✓', tie: '—', lose: '✗' };

export function QueryTypeMatrix() {
  useEffect(() => {
    reportState('QueryTypeMatrix', { rendered: true });
  }, []);

  return (
    <figure className={styles.figure} data-testid="query-type-matrix">
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Query type</th>
              <th>BM25 alone</th>
              <th>Dense alone</th>
              <th>Hybrid RRF</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.id} data-testid={`row-${row.id}`}>
                <td>
                  <span className={styles.queryType}>
                    {row.label}
                    <span className={styles.queryExample}>{row.example}</span>
                  </span>
                </td>
                <td className={`${styles.cell} ${styles[row.bm25]}`} data-testid={`cell-${row.id}-bm25`}>
                  {SYMBOLS[row.bm25]}
                </td>
                <td className={`${styles.cell} ${styles[row.dense]}`} data-testid={`cell-${row.id}-dense`}>
                  {SYMBOLS[row.dense]}
                </td>
                <td className={`${styles.cell} ${styles[row.hybrid]}`} data-testid={`cell-${row.id}-hybrid`}>
                  {SYMBOLS[row.hybrid]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summary}>
        Hybrid wins or ties on all 5 query types. BM25 alone or Dense alone has at least one losing case each.
      </div>

      <figcaption className={styles.caption}>
        ✓ = best retrieval result &nbsp;|&nbsp; — = adequate &nbsp;|&nbsp; ✗ = misses the relevant document
      </figcaption>
    </figure>
  );
}
