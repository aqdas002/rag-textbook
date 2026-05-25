# ToolSelectionExplorer

**Teaches:** `function-calling`, `tool-schema-design`, `tool-selection`, `parallel-tool-calls`

Side-by-side toolbox + LLM reasoning panel showing how the same 4 user queries play out against a "good schemas" toolbox vs a "bad schemas" toolbox. Makes visible: tool selection failures, argument hallucination, and missed parallel-call opportunities all trace back to schema quality.

Four pre-loaded queries cover: clean match, ambiguous selection (search vs book), missing context (forces clarification or hallucination), and parallel opportunity.

**Reported state:** `{ schemaQuality, activeQuery, selectedTools, outcome, didParallel }`
