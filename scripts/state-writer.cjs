const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(__dirname, '..', '.sim-state.json');
const PORT = 5174;

// Per-key merge for pendingAnswers / pendingGrades. null deletes a key.
function mergeMap(existing, incoming) {
  const out = existing && typeof existing === 'object' ? { ...existing } : {};
  if (incoming && typeof incoming === 'object') {
    for (const [k, v] of Object.entries(incoming)) {
      if (v === null) delete out[k];
      else out[k] = v;
    }
  }
  return out;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST' || req.url !== '/state') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end('invalid json');
      return;
    }

    let existing = {};
    try {
      if (fs.existsSync(STATE_FILE)) {
        existing = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      existing = {};
    }

    // Maintain recentInteractions ring buffer (cap 20) by diffing simState.
    const prevSim = existing.simState ?? {};
    const nextSim = parsed.simState ?? prevSim;
    const changes = [];
    if (parsed.simState) {
      for (const key of Object.keys(nextSim)) {
        if (JSON.stringify(prevSim[key]) !== JSON.stringify(nextSim[key])) {
          changes.push(`set ${key}=${JSON.stringify(nextSim[key])}`);
        }
      }
    }
    const recent = Array.isArray(existing.recentInteractions)
      ? existing.recentInteractions.slice()
      : [];
    if (changes.length > 0) {
      recent.push({ ts: new Date().toISOString(), action: changes.join(', ') });
      if (recent.length > 20) recent.splice(0, recent.length - 20);
    }

    const next = {
      ...existing,
      ...parsed,
      pendingAnswers: mergeMap(existing.pendingAnswers, parsed.pendingAnswers),
      pendingGrades: mergeMap(existing.pendingGrades, parsed.pendingGrades),
      version: 1,
      lastUpdated: new Date().toISOString(),
      recentInteractions: recent,
    };

    // Drop legacy singletons if they exist on disk from earlier versions.
    delete next.pendingAnswer;
    delete next.pendingGrade;

    const tmp = STATE_FILE + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
      fs.renameSync(tmp, STATE_FILE);
      res.writeHead(204);
      res.end();
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  if (require.main === module) console.log(`state-writer on http://127.0.0.1:${PORT}`);
});

module.exports = { server };
