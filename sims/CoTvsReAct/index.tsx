import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoTStep {
  thought: string;
}

interface ReActStep {
  thought: string;
  action?: string;
  observation?: string;
}

interface Problem {
  label: string;
  question: string;
  cotSteps: CoTStep[];
  cotFinalAnswer: string;
  cotCorrect: boolean;
  cotErrorType: string;
  reactSteps: ReActStep[];
  reactFinalAnswer: string;
  reactCorrect: boolean;
  cotCostUSD: number;
  reactCostUSD: number;
  cotLatencyS: number;
  reactLatencyS: number;
}

// ---------------------------------------------------------------------------
// Pre-loaded problems
// ---------------------------------------------------------------------------

const PROBLEMS: Problem[] = [
  // ─── Problem 0: Jacket pricing — arithmetic trap ──────────────────────────
  {
    label: 'Jacket pricing',
    question:
      'If a $1,200 jacket is on sale for 35% off, and there is an additional 15% off the sale price for members, what is the final price?',
    cotSteps: [
      {
        thought:
          '35% off plus 15% off equals 50% off total. So the combined discount is 50%.',
      },
      {
        thought:
          'Applying 50% off to $1,200: $1,200 × 0.50 = $600. The final price is $600.',
      },
    ],
    cotFinalAnswer: '$600',
    cotCorrect: false,
    cotErrorType: 'arithmetic error',
    reactSteps: [
      {
        thought:
          'I need to apply the 35% discount first to get the sale price, then apply the 15% member discount on top of that — not add percentages together.',
        action: 'calculator(1200 * 0.65)',
        observation: '780',
      },
      {
        thought:
          'The sale price after 35% off is $780. Now I apply the 15% member discount to that sale price.',
        action: 'calculator(780 * 0.85)',
        observation: '663',
      },
    ],
    reactFinalAnswer: '$663',
    reactCorrect: true,
    cotCostUSD: 0.003,
    reactCostUSD: 0.012,
    cotLatencyS: 1.2,
    reactLatencyS: 3.6,
  },

  // ─── Problem 1: 90-day trial — date arithmetic with off-by-one ───────────
  {
    label: '90-day trial',
    question:
      'If you start a 90-day trial on December 1, 2024, what is the last day of the trial?',
    cotSteps: [
      {
        thought:
          'December has 31 days. Starting December 1, there are 31 days in December. That accounts for 31 days through December 31.',
      },
      {
        thought:
          'We have used 31 days. We need 90 − 31 = 59 more days into the next year. January has 31 days. 59 − 31 = 28 more days remaining.',
      },
      {
        thought:
          'February 2025 has 28 days, so the 28th remaining day lands on February 28, 2025.',
      },
    ],
    cotFinalAnswer: 'February 28, 2025',
    cotCorrect: false,
    cotErrorType: 'off-by-one error',
    reactSteps: [
      {
        thought:
          'I should use a date calculator to add exactly 90 days to December 1, 2024 without any manual counting.',
        action: 'date_calculator(add, "2024-12-01", 90, "days")',
        observation: '"2025-03-01"',
      },
    ],
    reactFinalAnswer: 'March 1, 2025',
    reactCorrect: true,
    cotCostUSD: 0.003,
    reactCostUSD: 0.008,
    cotLatencyS: 1.4,
    reactLatencyS: 2.8,
  },

  // ─── Problem 2: FIFA World Cup — multi-step lookup with hallucination ──────
  {
    label: 'FIFA World Cup density',
    question:
      'What is the population density of the capital of the country that won the most recent FIFA World Cup?',
    cotSteps: [
      {
        thought:
          'The most recent FIFA World Cup was 2022 in Qatar. Argentina won that tournament.',
      },
      {
        thought:
          'The capital of Argentina is Buenos Aires.',
      },
      {
        thought:
          'Buenos Aires has a population of roughly 15 million people and an area of about 1,000 km². That gives a density of approximately 15,000 people per km².',
      },
    ],
    cotFinalAnswer: '~15,000 people/km²',
    cotCorrect: false,
    cotErrorType: 'hallucinated fact',
    reactSteps: [
      {
        thought:
          'I need to find the most recent FIFA World Cup winner — I should verify this rather than rely on memory.',
        action: 'search("most recent FIFA World Cup winner")',
        observation: 'Argentina won the 2022 FIFA World Cup, held in Qatar.',
      },
      {
        thought: 'Winner is Argentina. Now I need to verify its capital city.',
        action: 'search("capital of Argentina")',
        observation: 'The capital of Argentina is Buenos Aires.',
      },
      {
        thought:
          'Capital is Buenos Aires. Let me look up the actual population density rather than estimating.',
        action: 'search("Buenos Aires population density km2")',
        observation:
          'Buenos Aires (Autonomous City) has approximately 14,450 people per km² according to official census data.',
      },
    ],
    reactFinalAnswer: '~14,450 people/km² (verified)',
    reactCorrect: true,
    cotCostUSD: 0.003,
    reactCostUSD: 0.015,
    cotLatencyS: 1.3,
    reactLatencyS: 4.2,
  },
];

// ---------------------------------------------------------------------------
// Cumulative correctness across all seen problems
// ---------------------------------------------------------------------------

function computeStats(seenProblems: Problem[]) {
  const cotCorrectCount = seenProblems.filter(p => p.cotCorrect).length;
  const reactCorrectCount = seenProblems.filter(p => p.reactCorrect).length;
  return { cotCorrectCount, reactCorrectCount, total: seenProblems.length };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface CoTvsReActProps {
  initialProblemIndex?: number;
}

export function CoTvsReAct({ initialProblemIndex = 0 }: CoTvsReActProps) {
  const [activeProblemIndex, setActiveProblemIndex] = useState(initialProblemIndex);

  const problem = PROBLEMS[activeProblemIndex];

  // Count tool calls in ReAct trace (steps that have an action)
  const reactToolCalls = problem.reactSteps.filter(s => s.action !== undefined).length;
  const cotStepsCount = problem.cotSteps.length;
  const reactStepsCount = problem.reactSteps.length;

  useEffect(() => {
    reportState('CoTvsReAct', {
      activeProblem: activeProblemIndex,
      cotCorrect: problem.cotCorrect,
      reactCorrect: problem.reactCorrect,
      cotSteps: cotStepsCount,
      reactSteps: reactStepsCount,
      reactToolCalls,
    });
  }, [activeProblemIndex, problem, cotStepsCount, reactStepsCount, reactToolCalls]);

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Chain-of-Thought vs ReAct: Catching Mid-Reasoning Errors</h3>

      {/* Problem selector */}
      <div className={styles.selectorRow}>
        <span className={styles.selectorLabel}>Problem:</span>
        <div className={styles.selectorBtns} role="group" aria-label="Select problem">
          {PROBLEMS.map((p, i) => (
            <button
              key={i}
              className={`${styles.selectorBtn} ${i === activeProblemIndex ? styles.selectorBtnActive : ''}`}
              onClick={() => setActiveProblemIndex(i)}
              aria-pressed={i === activeProblemIndex}
              data-testid={`problem-btn-${i}`}
            >
              {i + 1}. {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className={styles.questionBox}>
        <span className={styles.questionLabel}>Question</span>
        <p className={styles.questionText}>{problem.question}</p>
      </div>

      {/* Side-by-side columns */}
      <div className={styles.columns}>
        {/* LEFT: Chain-of-Thought */}
        <div className={styles.column} data-testid="cot-column">
          <div className={styles.columnHeader}>
            <h4 className={styles.columnTitle}>Chain-of-Thought</h4>
            <span className={styles.columnSubtitle}>Internal reasoning only — no external checks</span>
          </div>

          <div className={styles.trace}>
            {problem.cotSteps.map((step, i) => (
              <div key={i} className={styles.thoughtCard} data-testid={`cot-step-${i}`}>
                <span className={styles.tagThought}>Thought</span>
                <p className={styles.traceText}>{step.thought}</p>
              </div>
            ))}
          </div>

          <div className={styles.answerBox}>
            <span className={styles.answerLabel}>Final Answer</span>
            <span className={styles.answerValue}>{problem.cotFinalAnswer}</span>
            <span
              className={`${styles.badge} ${problem.cotCorrect ? styles.badgeCorrect : styles.badgeWrong}`}
              data-testid="cot-answer-badge"
            >
              {problem.cotCorrect ? 'Correct' : `Wrong (${problem.cotErrorType})`}
            </span>
          </div>
        </div>

        {/* RIGHT: ReAct */}
        <div className={styles.column} data-testid="react-column">
          <div className={styles.columnHeader}>
            <h4 className={styles.columnTitle}>ReAct</h4>
            <span className={styles.columnSubtitle}>Thought → Action → Observation loop</span>
          </div>

          <div className={styles.trace}>
            {problem.reactSteps.map((step, i) => (
              <div key={i} className={styles.reactStepCard} data-testid={`react-step-${i}`}>
                <div className={styles.thoughtCard}>
                  <span className={styles.tagThought}>Thought</span>
                  <p className={styles.traceText}>{step.thought}</p>
                </div>
                {step.action && (
                  <div className={styles.actionCard}>
                    <span className={styles.tagAction}>Action</span>
                    <code className={styles.actionCode}>{step.action}</code>
                  </div>
                )}
                {step.observation && (
                  <div className={styles.observationCard}>
                    <span className={styles.tagObservation}>Observation</span>
                    <span className={styles.observationText}>{step.observation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.answerBox}>
            <span className={styles.answerLabel}>Final Answer</span>
            <span className={styles.answerValue}>{problem.reactFinalAnswer}</span>
            <span
              className={`${styles.badge} ${problem.reactCorrect ? styles.badgeCorrect : styles.badgeWrong}`}
              data-testid="react-answer-badge"
            >
              {problem.reactCorrect ? 'Correct (verified at each step)' : `Wrong (${problem.cotErrorType})`}
            </span>
          </div>
        </div>
      </div>

      {/* Stats panel */}
      <div className={styles.statsPanel} data-testid="stats-panel">
        <div className={styles.statGroup}>
          <span className={styles.statLabel}>Cost</span>
          <span className={styles.statValue}>
            CoT ${problem.cotCostUSD.toFixed(3)} / ReAct ${problem.reactCostUSD.toFixed(3)}
          </span>
        </div>
        <div className={styles.statGroup}>
          <span className={styles.statLabel}>Latency</span>
          <span className={styles.statValue}>
            CoT {problem.cotLatencyS.toFixed(1)}s / ReAct {problem.reactLatencyS.toFixed(1)}s
          </span>
        </div>
        <div className={styles.statGroup}>
          <span className={styles.statLabel}>Correctness</span>
          <span className={styles.statValue}>
            CoT {PROBLEMS.filter(p => p.cotCorrect).length}/{PROBLEMS.length} / ReAct {PROBLEMS.filter(p => p.reactCorrect).length}/{PROBLEMS.length}
          </span>
        </div>
        <div className={styles.statGroup}>
          <span className={styles.statLabel}>Tool calls (this problem)</span>
          <span className={styles.statValue}>CoT 0 / ReAct {reactToolCalls}</span>
        </div>
      </div>

      {/* Insight panel */}
      <div className={styles.insightPanel}>
        <strong>Key insight:</strong>{' '}
        {activeProblemIndex === 0 &&
          'CoT silently adds percentages (35% + 15% = 50%) — a classic error. ReAct runs each multiplication through a calculator, catching that discounts must be applied sequentially, not combined.'}
        {activeProblemIndex === 1 &&
          'Manual day-counting introduces an off-by-one error (December 1 is day 1, not day 0). ReAct delegates to a date calculator and gets the exact answer in one tool call.'}
        {activeProblemIndex === 2 &&
          'CoT confidently produces a plausible-sounding number (~15,000/km²) with no verification. ReAct grounds every intermediate fact in a search result, surfacing the correct figure of ~14,450/km².'}
      </div>
    </div>
  );
}
