import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Outcome = 'success' | 'wrong_answer' | 'step_limit';

interface TraceStep {
  thought: string;
  action: string;
  observation: string;
}

interface AgentTrace {
  id: string;
  query: string;
  outcome: Outcome;
  steps: number;
  cost: number;
  tools: string[];
  trace: TraceStep[];
  groundTruth: string;
  agentAnswer: string;
}

type FilterOption = 'all' | 'successes' | 'failures' | 'step_limit';
type SortOption = 'cost_desc' | 'steps_desc' | 'trace_id';

// ---------------------------------------------------------------------------
// Dataset — 8 traces
// ---------------------------------------------------------------------------

const ALL_TRACES: AgentTrace[] = [
  {
    id: 'trace-001',
    query: "What's the weather in Tokyo?",
    outcome: 'success',
    steps: 2,
    cost: 0.008,
    tools: ['get_weather'],
    groundTruth: 'Partly cloudy, 18°C',
    agentAnswer: 'Partly cloudy, 18°C',
    trace: [
      {
        thought: 'The user wants current weather in Tokyo. I will call get_weather.',
        action: 'get_weather("Tokyo")',
        observation: 'Weather: Partly cloudy, 18°C, humidity 65%, wind 12 km/h NE.',
      },
      {
        thought: 'I have the full weather data. I can answer directly.',
        action: 'respond("Partly cloudy, 18°C")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-002',
    query: 'Find me the cheapest flight to Paris next Tuesday',
    outcome: 'success',
    steps: 5,
    cost: 0.032,
    tools: ['search_flights', 'compare_prices'],
    groundTruth: 'Air France AF1234 at $312',
    agentAnswer: 'Air France AF1234 at $312',
    trace: [
      {
        thought: 'I need to find flights to Paris next Tuesday. Let me search available flights.',
        action: 'search_flights("Paris", "next Tuesday")',
        observation: 'Found 14 flights. Carriers: Air France, British Airways, Lufthansa, Delta, KLM.',
      },
      {
        thought: 'Good. Now I need to compare prices across these carriers to find the cheapest.',
        action: 'compare_prices(["Air France", "British Airways", "Lufthansa", "Delta", "KLM"])',
        observation: 'Price list: AF1234 $312, BA456 $389, LH789 $341, DL012 $425, KL345 $298.',
      },
      {
        thought: 'KL345 at $298 looks cheaper. Let me verify it is a direct flight.',
        action: 'search_flights("Paris", "next Tuesday", carrier="KLM")',
        observation: 'KL345 has 1 stop (Amsterdam). Travel time 9h. AF1234 is direct, 11h 30m.',
      },
      {
        thought: 'The user asked for cheapest flight — KL345 is cheaper but has a stop. AF1234 is direct but $14 more. Clarifying "cheapest" as lowest fare.',
        action: 'compare_prices(["KLM KL345", "Air France AF1234"], include_stops=true)',
        observation: 'KL345: $298 (1 stop). AF1234: $312 (direct). Cheapest overall: KL345.',
      },
      {
        thought: 'Wait — the original query asked for cheapest flight, not cheapest direct. But let me re-read: "cheapest flight to Paris". That means KL345. However the ground truth shows AF1234. I will go with the lowest fare direct flight.',
        action: 'respond("Air France AF1234 at $312 — cheapest direct flight")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-003',
    query: 'Compare Anthropic and OpenAI funding',
    outcome: 'success',
    steps: 4,
    cost: 0.028,
    tools: ['search', 'calculator'],
    groundTruth: 'OpenAI raised ~$13B, Anthropic ~$7.6B; difference ~$5.4B',
    agentAnswer: 'OpenAI raised ~$13B, Anthropic ~$7.6B; difference ~$5.4B',
    trace: [
      {
        thought: 'I need to find funding totals for both companies then compare them.',
        action: 'search("Anthropic total funding raised 2024")',
        observation: 'Anthropic has raised approximately $7.6 billion across all rounds as of 2024.',
      },
      {
        thought: "Got Anthropic's total: $7.6B. Now I need OpenAI's figure.",
        action: 'search("OpenAI total funding raised 2024")',
        observation: 'OpenAI has raised approximately $13 billion including $10B+ from Microsoft.',
      },
      {
        thought: 'I have both figures. I need to compute the difference.',
        action: 'calculator("13.0 - 7.6")',
        observation: 'Result: 5.4',
      },
      {
        thought: 'All data gathered. Ready to compose the final comparison.',
        action: 'respond("OpenAI raised ~$13B, Anthropic ~$7.6B; difference ~$5.4B")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-004',
    query: 'Book a meeting with the team tomorrow at 2pm',
    outcome: 'success',
    steps: 3,
    cost: 0.018,
    tools: ['get_calendar', 'create_meeting'],
    groundTruth: 'Meeting created: Team Sync, tomorrow 2:00–2:30 PM',
    agentAnswer: 'Meeting created: Team Sync, tomorrow 2:00–2:30 PM',
    trace: [
      {
        thought: 'I need to check if tomorrow at 2pm is available before creating the meeting.',
        action: 'get_calendar("tomorrow", "14:00")',
        observation: 'Calendar is free from 13:30 to 15:00 tomorrow.',
      },
      {
        thought: 'The slot is available. I will create the meeting.',
        action: 'create_meeting("Team Sync", "tomorrow", "14:00", duration=30)',
        observation: 'Meeting created: Team Sync, 2026-05-26 14:00–14:30. Invites sent to 4 team members.',
      },
      {
        thought: 'Meeting has been created and invites sent. Ready to confirm.',
        action: 'respond("Meeting created: Team Sync, tomorrow 2:00–2:30 PM")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-005',
    query: 'Summarize the Q3 customer feedback',
    outcome: 'success',
    steps: 6,
    cost: 0.045,
    tools: ['search', 'summarize'],
    groundTruth: 'Top themes: UX issues (42%), performance (28%), billing confusion (18%)',
    agentAnswer: 'Top themes: UX issues (42%), performance (28%), billing confusion (18%)',
    trace: [
      {
        thought: 'I need to retrieve Q3 customer feedback. Let me search for it.',
        action: 'search("Q3 customer feedback 2025")',
        observation: 'Found 3 feedback collections: NPS surveys, support tickets, review aggregator.',
      },
      {
        thought: 'There are multiple sources. I should pull each one for completeness.',
        action: 'search("Q3 NPS survey results")',
        observation: 'NPS survey: 847 responses. Common complaints: slow load times, confusing billing.',
      },
      {
        thought: 'Got NPS data. Now retrieving support ticket themes.',
        action: 'search("Q3 support ticket categories")',
        observation: 'Support tickets: 1,204 tickets. Categories: UX (42%), performance (28%), billing (18%), other (12%).',
      },
      {
        thought: 'Excellent. Now I have category data from support tickets. Let me also get the review aggregator data.',
        action: 'search("Q3 review aggregator summary")',
        observation: 'Review aggregator: avg 3.8/5. Frequent negatives: UI complexity, slow dashboard load.',
      },
      {
        thought: 'I have all three sources. Time to synthesize.',
        action: 'summarize([NPS, support_tickets, reviews])',
        observation: 'Summary generated: Top themes align across sources — UX issues (42%), performance (28%), billing confusion (18%).',
      },
      {
        thought: 'Summary is ready. Delivering the answer.',
        action: 'respond("Top themes: UX issues (42%), performance (28%), billing confusion (18%)")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-006',
    query: "What's the population of the capital of the country that won World Cup 2022?",
    outcome: 'success',
    steps: 4,
    cost: 0.025,
    tools: ['search'],
    groundTruth: 'Buenos Aires population ~3.1M city / ~15M metro',
    agentAnswer: 'Buenos Aires population ~3.1M city / ~15M metro',
    trace: [
      {
        thought: 'Multi-hop question: find the 2022 World Cup winner → get its capital → get the population.',
        action: 'search("FIFA World Cup 2022 winner")',
        observation: 'Argentina won the 2022 FIFA World Cup, defeating France on penalties.',
      },
      {
        thought: "Argentina won. Now I need Argentina's capital.",
        action: 'search("capital city of Argentina")',
        observation: "Argentina's capital is Buenos Aires.",
      },
      {
        thought: "Got the capital: Buenos Aires. Now I need its population.",
        action: 'search("Buenos Aires population 2024")',
        observation: 'Buenos Aires city proper: approximately 3.1 million. Greater Buenos Aires metro: approximately 15 million.',
      },
      {
        thought: 'I have all three pieces of information. Ready to answer.',
        action: 'respond("Buenos Aires population ~3.1M city / ~15M metro")',
        observation: 'Answer delivered.',
      },
    ],
  },
  {
    id: 'trace-007',
    query: 'Find all open AUTH issues blocking the v2.1 release',
    outcome: 'step_limit',
    steps: 12,
    cost: 0.18,
    tools: ['search', 'lookup'],
    groundTruth: 'AUTH-1024, AUTH-1045, AUTH-1102 are open blockers',
    agentAnswer: '(step limit reached — incomplete)',
    trace: [
      {
        thought: "I need to find the v2.1 release plan to know which tickets are blockers.",
        action: 'search("v2.1 release plan authentication service")',
        observation: 'Release plan lists 5 required tickets: AUTH-1024, AUTH-1031, AUTH-1045, AUTH-1102, AUTH-1118.',
      },
      {
        thought: 'I have 5 tickets. I need to check each one individually.',
        action: 'lookup("AUTH-1024")',
        observation: 'AUTH-1024: Token refresh fails silently. Status: OPEN. Priority: Blocker.',
      },
      {
        thought: 'AUTH-1024 is open. Checking AUTH-1031.',
        action: 'lookup("AUTH-1031")',
        observation: 'AUTH-1031: SSO redirect loop under high concurrency. Status: CLOSED.',
      },
      {
        thought: 'AUTH-1031 closed. Checking AUTH-1045.',
        action: 'lookup("AUTH-1045")',
        observation: 'AUTH-1045: JWT signing key rotation breaks active sessions. Status: OPEN. Priority: Blocker.',
      },
      {
        thought: 'AUTH-1045 is open. Checking AUTH-1102.',
        action: 'lookup("AUTH-1102")',
        observation: 'AUTH-1102: Audit log timestamps off by one hour in DST regions. Status: OPEN. Priority: Major.',
      },
      {
        thought: 'AUTH-1102 is open. Checking AUTH-1118.',
        action: 'lookup("AUTH-1118")',
        observation: 'AUTH-1118: OAuth PKCE flow not supported for mobile clients. Status: CLOSED.',
      },
      {
        thought: '3 open tickets found. Let me do a broader search to make sure there are no other AUTH issues not in the release plan.',
        action: 'search("AUTH open issues v2.1 not in release plan")',
        observation: 'Found 2 additional issues: AUTH-1130 (minor UX), AUTH-1135 (docs update). Neither is marked as blocking v2.1.',
      },
      {
        thought: 'I should look up AUTH-1130 to confirm its priority.',
        action: 'lookup("AUTH-1130")',
        observation: 'AUTH-1130: Login button misalignment on Safari. Priority: Minor. Not a v2.1 blocker.',
      },
      {
        thought: 'AUTH-1130 is minor. Checking AUTH-1135.',
        action: 'lookup("AUTH-1135")',
        observation: 'AUTH-1135: Update API docs for OAuth 2.1. Priority: Nice-to-have. Not a blocker.',
      },
      {
        thought: 'All clear. Let me now cross-reference the open blockers with the sprint backlog.',
        action: 'search("sprint backlog AUTH blockers v2.1")',
        observation: 'Sprint backlog shows AUTH-1024, AUTH-1045, AUTH-1102 in the current sprint. AUTH-1102 has a PR open.',
      },
      {
        thought: 'AUTH-1102 has an open PR. I should look up its status.',
        action: 'lookup("AUTH-1102 PR status")',
        observation: 'PR #892 for AUTH-1102 is under review. Not yet merged.',
      },
      {
        thought: 'I now have a complete picture. AUTH-1024, AUTH-1045, AUTH-1102 are open blockers. AUTH-1031 and AUTH-1118 are closed. But wait — I should check whether AUTH-1024 has any PRs too.',
        action: 'lookup("AUTH-1024 PR status")',
        observation: '(STEP LIMIT REACHED — agent terminated)',
      },
    ],
  },
  {
    id: 'trace-008',
    query: 'Calculate the compound interest on $5000 at 4% for 10 years',
    outcome: 'wrong_answer',
    steps: 3,
    cost: 0.012,
    tools: ['calculator'],
    groundTruth: '$7,401.22',
    agentAnswer: '$7,401.00 (off-by-one rounding error)',
    trace: [
      {
        thought: 'Compound interest formula: A = P(1 + r)^t. P=5000, r=0.04, t=10.',
        action: 'calculator("5000 * (1 + 0.04) ^ 10")',
        observation: 'Result: 7401.2199...',
      },
      {
        thought: 'I have the raw result. I will round to the nearest dollar.',
        action: 'calculator("round(7401.2199, 0)")',
        observation: 'Result: 7401',
      },
      {
        thought: 'The result is $7,401. Delivering the answer.',
        action: 'respond("$7,401.00")',
        observation: 'Answer delivered. (Note: ground truth is $7,401.22 — agent rounded to nearest dollar instead of nearest cent.)',
      },
    ],
  },
];

const TOTAL_TOOLS_AVAILABLE = 7; // get_weather, search_flights, compare_prices, search, calculator, get_calendar, create_meeting, summarize, lookup → 7 distinct used

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDistinctTools(traces: AgentTrace[]): Set<string> {
  const tools = new Set<string>();
  for (const t of traces) {
    for (const tool of t.tools) {
      tools.add(tool);
    }
  }
  return tools;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeP99(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.99 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computeSummary(traces: AgentTrace[]) {
  if (traces.length === 0) {
    return {
      successRate: 0,
      meanSteps: 0,
      medianCost: 0,
      p99Cost: 0,
      toolDiversity: 0,
      stepLimitHitRate: 0,
    };
  }

  const successes = traces.filter(t => t.outcome === 'success').length;
  const successRate = successes / traces.length;

  const meanSteps = traces.reduce((sum, t) => sum + t.steps, 0) / traces.length;

  const costs = traces.map(t => t.cost);
  const medianCost = computeMedian(costs);
  const p99Cost = computeP99(costs);

  const distinctTools = getDistinctTools(traces);
  const toolDiversity = distinctTools.size / TOTAL_TOOLS_AVAILABLE;

  const stepLimitHits = traces.filter(t => t.outcome === 'step_limit').length;
  const stepLimitHitRate = stepLimitHits / traces.length;

  return { successRate, meanSteps, medianCost, p99Cost, toolDiversity, stepLimitHitRate };
}

function applyFilter(traces: AgentTrace[], filter: FilterOption): AgentTrace[] {
  switch (filter) {
    case 'successes':
      return traces.filter(t => t.outcome === 'success');
    case 'failures':
      return traces.filter(t => t.outcome !== 'success');
    case 'step_limit':
      return traces.filter(t => t.outcome === 'step_limit');
    default:
      return traces;
  }
}

function applySort(traces: AgentTrace[], sort: SortOption): AgentTrace[] {
  return [...traces].sort((a, b) => {
    if (sort === 'cost_desc') return b.cost - a.cost;
    if (sort === 'steps_desc') return b.steps - a.steps;
    return a.id.localeCompare(b.id);
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  if (outcome === 'success') {
    return <span className={`${styles.badge} ${styles.badgeSuccess}`}>&#10003; success</span>;
  }
  if (outcome === 'step_limit') {
    return <span className={`${styles.badge} ${styles.badgeStepLimit}`}>&#9203; step limit</span>;
  }
  return <span className={`${styles.badge} ${styles.badgeWrong}`}>&#10007; wrong answer</span>;
}

function TraceRow({
  trace,
  expanded,
  onToggle,
}: {
  trace: AgentTrace;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`${styles.traceRow} ${expanded ? styles.traceRowExpanded : ''}`}
      data-testid={`trace-row-${trace.id}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
    >
      <div className={styles.traceRowMain}>
        <span className={styles.traceId}>{trace.id}</span>
        <span className={styles.traceQuery} title={trace.query}>
          {trace.query.length > 55 ? trace.query.slice(0, 55) + '…' : trace.query}
        </span>
        <OutcomeBadge outcome={trace.outcome} />
        <span className={styles.traceSteps}>{trace.steps} steps</span>
        <span className={styles.traceCost}>${trace.cost.toFixed(3)}</span>
        <div className={styles.toolChips}>
          {[...new Set(trace.tools)].map(tool => (
            <span key={tool} className={styles.toolChip}>{tool}</span>
          ))}
        </div>
      </div>

      {expanded && (
        <div
          className={styles.traceDetail}
          data-testid={`trace-detail-${trace.id}`}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.traceDetailHeader}>
            <strong>Query:</strong> {trace.query}
          </div>
          <div className={styles.traceDetailMeta}>
            <span><strong>Ground truth:</strong> {trace.groundTruth}</span>
            <span><strong>Agent answer:</strong> {trace.agentAnswer}</span>
          </div>
          <div className={styles.stepList}>
            {trace.trace.map((step, i) => (
              <div key={i} className={styles.stepCard} data-testid={`step-${trace.id}-${i}`}>
                <div className={styles.stepNumber}>Step {i + 1}</div>
                <div className={styles.stepSection}>
                  <span className={styles.stepLabel}>Thought</span>
                  <span className={styles.stepThought}>{step.thought}</span>
                </div>
                <div className={styles.stepSection}>
                  <span className={styles.stepLabel}>Action</span>
                  <code className={styles.stepAction}>{step.action}</code>
                </div>
                <div className={styles.stepSection}>
                  <span className={styles.stepLabel}>Observation</span>
                  <span className={styles.stepObservation}>{step.observation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AgentTraceDashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('trace_id');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const filteredTraces = useMemo(
    () => applySort(applyFilter(ALL_TRACES, activeFilter), activeSort),
    [activeFilter, activeSort],
  );

  const summary = useMemo(() => computeSummary(filteredTraces), [filteredTraces]);

  useEffect(() => {
    reportState('AgentTraceDashboard', {
      activeFilter,
      displayedCount: filteredTraces.length,
      successRate: summary.successRate,
      medianCost: summary.medianCost,
      p99Cost: summary.p99Cost,
      toolDiversity: summary.toolDiversity,
      stepLimitHitRate: summary.stepLimitHitRate,
    });
  }, [activeFilter, filteredTraces, summary]);

  function toggleTrace(id: string) {
    setExpandedTraceId(prev => (prev === id ? null : id));
  }

  const FILTER_OPTIONS: { label: string; value: FilterOption }[] = [
    { label: 'All', value: 'all' },
    { label: 'Successes only', value: 'successes' },
    { label: 'Failures only', value: 'failures' },
    { label: 'Step-limit hits', value: 'step_limit' },
  ];

  const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Cost (high → low)', value: 'cost_desc' },
    { label: 'Steps (high → low)', value: 'steps_desc' },
    { label: 'Trace ID', value: 'trace_id' },
  ];

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Agent Trace Evaluation Dashboard</h3>

      {/* Summary panel */}
      <div className={styles.summaryPanel} data-testid="summary-panel">
        <h4 className={styles.sectionTitle}>Summary Metrics</h4>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Success rate</span>
            <span className={styles.metricValue} data-testid="metric-success-rate">
              {(summary.successRate * 100).toFixed(0)}%
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Mean steps</span>
            <span className={styles.metricValue} data-testid="metric-mean-steps">
              {summary.meanSteps.toFixed(1)}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Median cost</span>
            <span className={styles.metricValue} data-testid="metric-median-cost">
              ${summary.medianCost.toFixed(3)}
            </span>
          </div>
          <div className={`${styles.metricCard} ${styles.metricOutlier}`}>
            <span className={styles.metricLabel}>p99 cost</span>
            <span className={styles.metricValue} data-testid="metric-p99-cost">
              ${summary.p99Cost.toFixed(3)}
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Tool diversity</span>
            <span className={styles.metricValue} data-testid="metric-tool-diversity">
              {(summary.toolDiversity * 100).toFixed(0)}%
            </span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Step-limit hit rate</span>
            <span className={styles.metricValue} data-testid="metric-step-limit">
              {(summary.stepLimitHitRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <p className={styles.summaryNote}>
          Computed across {filteredTraces.length} of {ALL_TRACES.length} traces.
        </p>
      </div>

      {/* Filter controls */}
      <div className={styles.controls} data-testid="filter-controls">
        <div className={styles.filterGroup}>
          <span className={styles.controlLabel}>Filter by outcome:</span>
          <div className={styles.buttonGroup}>
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`${styles.filterBtn} ${activeFilter === opt.value ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter(opt.value)}
                aria-pressed={activeFilter === opt.value}
                data-testid={`filter-btn-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sortGroup}>
          <label htmlFor="sort-select" className={styles.controlLabel}>Sort by:</label>
          <select
            id="sort-select"
            className={styles.sortSelect}
            value={activeSort}
            onChange={e => setActiveSort(e.target.value as SortOption)}
            aria-label="Sort traces"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trace list */}
      <div className={styles.traceList} data-testid="trace-list">
        <div className={styles.traceListHeader}>
          <span>Trace ID</span>
          <span>Query</span>
          <span>Outcome</span>
          <span>Steps</span>
          <span>Cost</span>
          <span>Tools</span>
        </div>
        {filteredTraces.length === 0 ? (
          <div className={styles.emptyState} data-testid="empty-state">
            No traces match the current filter.
          </div>
        ) : (
          filteredTraces.map(trace => (
            <TraceRow
              key={trace.id}
              trace={trace}
              expanded={expandedTraceId === trace.id}
              onToggle={() => toggleTrace(trace.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
