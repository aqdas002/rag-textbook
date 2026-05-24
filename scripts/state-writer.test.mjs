import { test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const STATE_FILE = path.join(__dirname, '..', '.sim-state.json');
let server;

beforeAll(async () => {
  server = require('./state-writer.cjs').server;
  // Wait for the server to start listening
  await new Promise((resolve, reject) => {
    if (server.listening) return resolve();
    server.once('listening', resolve);
    server.once('error', reject);
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
});

beforeEach(() => {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
});

async function post(body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port: 5174, path: '/state', method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

test('writes posted body to .sim-state.json with version + lastUpdated', async () => {
  const res = await post({ currentChapter: 'chunking', simState: { chunkSize: 256 } });
  expect(res.status).toBe(204);
  const written = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(written.version).toBe(1);
  expect(written.currentChapter).toBe('chunking');
  expect(written.simState.chunkSize).toBe(256);
  expect(typeof written.lastUpdated).toBe('string');
});

test('preserves existing fields not present in incoming POST', async () => {
  await post({ currentChapter: 'chunking', simState: { chunkSize: 100 } });
  await post({ pendingAnswers: { c1: { concept: 'c1', answer: 'a' } } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.simState.chunkSize).toBe(100); // preserved
  expect(w.pendingAnswers.c1.concept).toBe('c1');
});

test('pendingAnswers / pendingGrades merge per-concept across posts', async () => {
  await post({ pendingAnswers: { c1: { concept: 'c1', answer: 'a1' } } });
  await post({ pendingAnswers: { c2: { concept: 'c2', answer: 'a2' } } });
  await post({ pendingGrades: { c1: { concept: 'c1', rating: 3, comment: 'ok' } } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  // Both pending answers survive the second post
  expect(w.pendingAnswers.c1.answer).toBe('a1');
  expect(w.pendingAnswers.c2.answer).toBe('a2');
  // Grade was added without disturbing answers
  expect(w.pendingGrades.c1.rating).toBe(3);
});

test('null clears a specific concept from pendingAnswers / pendingGrades', async () => {
  await post({ pendingAnswers: { c1: { concept: 'c1', answer: 'a' }, c2: { concept: 'c2', answer: 'b' } } });
  await post({ pendingAnswers: { c1: null } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.pendingAnswers.c1).toBeUndefined();
  expect(w.pendingAnswers.c2.answer).toBe('b');
});

test('drops legacy singleton pendingAnswer / pendingGrade keys on next write', async () => {
  // Simulate a file written by the old code with singleton keys
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    version: 1,
    pendingAnswer: { concept: 'c1', answer: 'legacy' },
    pendingGrade: { concept: 'c1', rating: 2, comment: '' },
  }));
  await post({ simState: { chunkSize: 1 } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.pendingAnswer).toBeUndefined();
  expect(w.pendingGrade).toBeUndefined();
});

test('appends to recentInteractions ring buffer when simState changes', async () => {
  await post({ simState: { chunkSize: 100 } });
  await post({ simState: { chunkSize: 200 } });
  await post({ simState: { chunkSize: 200 } }); // no change
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(Array.isArray(w.recentInteractions)).toBe(true);
  expect(w.recentInteractions).toHaveLength(2); // only the two actual changes
  expect(w.recentInteractions[1].action).toMatch(/chunkSize.*200/);
});

test('ring buffer caps at 20 entries', async () => {
  for (let i = 0; i < 25; i++) await post({ simState: { chunkSize: i } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.recentInteractions).toHaveLength(20);
});

test('returns 400 on invalid JSON', async () => {
  const res = await new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: 5174, path: '/state', method: 'POST' }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve({ status: r.statusCode, body: d }));
    });
    req.write('not json');
    req.end();
  });
  expect(res.status).toBe(400);
});

test('returns 404 for non-/state paths', async () => {
  const res = await new Promise((resolve) => {
    http.get('http://127.0.0.1:5174/other', r => {
      r.on('data', () => {}); r.on('end', () => resolve({ status: r.statusCode }));
    });
  });
  expect(res.status).toBe(404);
});
