import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { configHandler, identificationHandler } from '../../server/http';

let server: Server;
let base: string;
const realFetch = globalThis.fetch;
const image = readFileSync('public/icon-192.png').toString('base64');
const body = () =>
  JSON.stringify({
    image: { data: image, mimeType: 'image/png' },
    candidates: ['moon', 'jupiter'],
    context: { time: new Date().toISOString() },
  });
beforeAll(async () => {
  server = createServer((req, res) =>
    req.url === '/api/config' ? configHandler(req, res) : void identificationHandler(req, res),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  base = `http://127.0.0.1:${address.port}`;
  vi.stubEnv('GEMMA_API_KEY', '');
});
afterAll(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});
const post = (value: string, headers: Record<string, string> = {}) =>
  realFetch(base + '/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: value,
  });
it('serves private-free status and rejects cross-origin or wrong-method requests', async () => {
  const status = await realFetch(base + '/api/config');
  expect(status.headers.get('cache-control')).toBe('no-store');
  expect(await status.json()).toMatchObject({ liveAvailable: false });
  expect((await realFetch(base + '/api/identify')).status).toBe(405);
  expect((await post(body(), { Origin: 'https://unrelated.example' })).status).toBe(403);
});
it('rejects oversized requests, unsupported media, and malformed JSON before model inference', async () => {
  expect((await post('x'.repeat(2_900_001))).status).toBe(413);
  expect((await post(body(), { 'Content-Type': 'text/plain' })).status).toBe(415);
  expect((await post('{')).status).toBe(400);
});
it('reports a missing model credential as unavailable rather than a discovery', async () => {
  const response = await post(body());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: 'Live Gemma is not connected yet. You can still explore in practice mode.',
  });
});
it('runs real HTTP parsing through the model boundary, then enforces rate limits', async () => {
  vi.stubEnv('GEMMA_API_KEY', 'private-test-key');
  let certain = true;
  const upstream = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
    if (String(input).startsWith('https://generativelanguage.googleapis.com/')) {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      object: 'moon',
                      confidence: 0.94,
                      distinctiveFeatures: certain,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      );
    }
    return realFetch(input, options);
  });
  const matched = await post(body());
  expect(matched.status).toBe(200);
  expect(await matched.json()).toMatchObject({ object: 'moon', provider: 'gemma' });
  certain = false;
  const uncertain = await post(body());
  expect(await uncertain.json()).toMatchObject({ object: null, provider: 'gemma' });
  const limited = await post(body());
  expect(limited.status).toBe(429);
  expect(limited.headers.get('retry-after')).toBe('60');
  expect(upstream).toHaveBeenCalledTimes(2);
});
