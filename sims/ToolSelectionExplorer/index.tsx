import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type SchemaQuality = 'good' | 'bad';

interface Tool {
  name: string;
  description: string;
  params: Record<string, string>;
}

const TOOLS_GOOD: Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current or forecast weather for a city on a specific date. Returns temperature, conditions, and precipitation chance.',
    params: { city: 'string (city name)', date: 'string (YYYY-MM-DD)' },
  },
  {
    name: 'search_flights',
    description: 'Search for available flights between two airports on a given date. Returns a list of flights with prices. Does NOT book the flight.',
    params: { from: 'string (IATA code)', to: 'string (IATA code)', date: 'string (YYYY-MM-DD)' },
  },
  {
    name: 'book_flight',
    description: 'Book a flight by its ID. Charges the user. Only call after the user has explicitly confirmed which flight to book.',
    params: { flight_id: 'string (from search_flights result)', passenger_name: 'string' },
  },
  {
    name: 'get_calendar_events',
    description: "Get the user's scheduled calendar events on a specific date.",
    params: { date: 'string (YYYY-MM-DD)' },
  },
];

const TOOLS_BAD: Tool[] = [
  { name: 'get_weather', description: 'Weather.', params: { city: 'string', date: 'string' } },
  { name: 'search_flights', description: 'Flights.', params: { from: 'string', to: 'string', date: 'string' } },
  { name: 'book_flight', description: 'Flight booking.', params: { id: 'string', name: 'string' } },
  { name: 'get_calendar_events', description: 'Calendar.', params: { date: 'string' } },
];

interface QueryScenario {
  text: string;
  description: string;
}

const QUERIES: QueryScenario[] = [
  { text: "What's the weather in Tokyo tomorrow?", description: 'Clean match — unambiguous tool selection' },
  { text: 'I want to fly to Paris next week', description: 'Ambiguous — search_flights vs book_flight' },
  { text: 'Book the cheapest flight', description: 'Missing context — required args not in query' },
  { text: "What's my schedule tomorrow and the weather?", description: 'Parallel opportunity — two independent tool calls' },
];

interface ToolCall {
  tool: string;
  args: Record<string, string>;
}

interface Behavior {
  reasoning: string;
  calls: ToolCall[];
  outcome: 'Correct' | 'Wrong tool' | 'Hallucinated args' | 'Asked for clarification' | 'Parallel call';
  didParallel: boolean;
  outcomeNote: string;
}

const BEHAVIOR: Record<SchemaQuality, Behavior[]> = {
  good: [
    {
      reasoning: 'User asks for weather in Tokyo tomorrow. get_weather matches perfectly; city=Tokyo, date=tomorrow.',
      calls: [{ tool: 'get_weather', args: { city: 'Tokyo', date: '2026-05-25' } }],
      outcome: 'Correct',
      didParallel: false,
      outcomeNote: 'Clean tool selection. The schema description made the match unambiguous.',
    },
    {
      reasoning: 'User wants to fly. The description of search_flights explicitly says "Does NOT book the flight" — so I should search first, then book only after confirmation.',
      calls: [{ tool: 'search_flights', args: { from: '(missing)', to: 'CDG', date: '2026-06-01' } }],
      outcome: 'Correct',
      didParallel: false,
      outcomeNote: 'search_flights is correct. The description disambiguates: book_flight requires a confirmed flight_id.',
    },
    {
      reasoning: 'The query says "cheapest flight" but the book_flight schema requires a flight_id from search_flights. The user has not searched yet. I should ask for clarification rather than invent a flight_id.',
      calls: [],
      outcome: 'Asked for clarification',
      didParallel: false,
      outcomeNote: 'Good schemas force the LLM to ask for missing context instead of hallucinating.',
    },
    {
      reasoning: 'User wants two independent pieces of info: schedule + weather. These can be fetched in parallel (no data dependency).',
      calls: [
        { tool: 'get_calendar_events', args: { date: '2026-05-25' } },
        { tool: 'get_weather', args: { city: '(use user location)', date: '2026-05-25' } },
      ],
      outcome: 'Parallel call',
      didParallel: true,
      outcomeNote: 'Both tools called in the same round-trip. One network round-trip instead of two — half the latency.',
    },
  ],
  bad: [
    {
      reasoning: 'Weather, Tokyo, tomorrow → get_weather.',
      calls: [{ tool: 'get_weather', args: { city: 'Tokyo', date: '2026-05-25' } }],
      outcome: 'Correct',
      didParallel: false,
      outcomeNote: 'Even with vague descriptions, the clean query matches.',
    },
    {
      reasoning: 'User wants to fly to Paris. Description says "Flight booking." That sounds like what the user wants. Calling book_flight.',
      calls: [{ tool: 'book_flight', args: { id: 'PAR-001', name: 'user' } }],
      outcome: 'Wrong tool',
      didParallel: false,
      outcomeNote: 'Bad descriptions led the LLM to call book_flight directly, skipping the search step. In production this would charge the user for a flight they never confirmed.',
    },
    {
      reasoning: 'User wants the cheapest flight booked. Calling book_flight with id="cheapest".',
      calls: [{ tool: 'book_flight', args: { id: 'cheapest', name: 'user' } }],
      outcome: 'Hallucinated args',
      didParallel: false,
      outcomeNote: 'No real flight ID exists. The LLM hallucinated "cheapest" as an ID because the schema did not specify that IDs come from search_flights.',
    },
    {
      reasoning: 'Schedule + weather. Calling get_calendar_events first; will figure out weather after.',
      calls: [{ tool: 'get_calendar_events', args: { date: '2026-05-25' } }],
      outcome: 'Wrong tool',
      didParallel: false,
      outcomeNote: 'Sequential when it could have been parallel. Bad descriptions did not signal that these are independent operations. Doubles the user-visible latency.',
    },
  ],
};

interface Props {
  initialSchemaQuality?: SchemaQuality;
  initialQueryIndex?: number;
}

export function ToolSelectionExplorer({
  initialSchemaQuality = 'good',
  initialQueryIndex = 0,
}: Props) {
  const [schemaQuality, setSchemaQuality] = useState<SchemaQuality>(initialSchemaQuality);
  const [queryIndex, setQueryIndex] = useState<number>(initialQueryIndex);

  const tools = schemaQuality === 'good' ? TOOLS_GOOD : TOOLS_BAD;
  const behavior = BEHAVIOR[schemaQuality][queryIndex]!;
  const query = QUERIES[queryIndex]!;

  useEffect(() => {
    reportState('ToolSelectionExplorer', {
      schemaQuality,
      activeQuery: query.text,
      selectedTools: behavior.calls.map(c => c.tool),
      outcome: behavior.outcome,
      didParallel: behavior.didParallel,
    });
  }, [schemaQuality, queryIndex, query.text, behavior]);

  const outcomeColor =
    behavior.outcome === 'Correct' || behavior.outcome === 'Parallel call' || behavior.outcome === 'Asked for clarification'
      ? styles.outcomeGood
      : styles.outcomeBad;

  return (
    <div className={styles.sim}>
      <div className={styles.qualityRow}>
        <span className={styles.label}>Schema quality:</span>
        <button
          type="button"
          className={schemaQuality === 'good' ? styles.toggleActive : styles.toggle}
          onClick={() => setSchemaQuality('good')}
        >
          Good
        </button>
        <button
          type="button"
          className={schemaQuality === 'bad' ? styles.toggleActive : styles.toggle}
          onClick={() => setSchemaQuality('bad')}
        >
          Bad
        </button>
      </div>

      <div className={styles.panes}>
        <div className={styles.toolboxPane}>
          <h4>Toolbox</h4>
          {tools.map((t, i) => (
            <div key={t.name} data-testid={`tool-card-${i}`} className={styles.toolCard}>
              <div className={styles.toolName}>{t.name}</div>
              <div className={styles.toolDesc}>{t.description}</div>
              <div className={styles.toolParams}>
                ({Object.entries(t.params).map(([k, v]) => `${k}: ${v}`).join(', ')})
              </div>
            </div>
          ))}
        </div>

        <div className={styles.resultPane}>
          <h4>Query</h4>
          <div className={styles.querySelector}>
            {QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                className={i === queryIndex ? styles.queryActive : styles.queryButton}
                onClick={() => setQueryIndex(i)}
              >
                {i + 1}. {q.description}
              </button>
            ))}
          </div>
          <div className={styles.queryText}>"{query.text}"</div>

          <h4>LLM reasoning</h4>
          <div className={styles.reasoning}>{behavior.reasoning}</div>

          <h4>Tool calls</h4>
          {behavior.calls.length === 0 ? (
            <div className={styles.noCalls}>(no tool calls — clarification requested)</div>
          ) : (
            behavior.calls.map((c, i) => (
              <div key={i} className={styles.toolCall}>
                <code>
                  {c.tool}({Object.entries(c.args).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')})
                </code>
              </div>
            ))
          )}

          <div className={styles.outcomeRow}>
            <span className={`${styles.outcome} ${outcomeColor}`}>{behavior.outcome}</span>
            <span className={styles.outcomeNote}>{behavior.outcomeNote}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
