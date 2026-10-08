import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { ApiError, identifyWithGemma, MAX_BODY_BYTES, publicConfig } from './identify.js';

type ApiRequest = IncomingMessage & { body?: unknown };
const buckets = new Map<string, { count: number; until: number }>();
let active = 0;
function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}
function limit(req: ApiRequest) {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.until < now) buckets.delete(key);
  // Vercel sets x-forwarded-for; local development uses the socket address.
  const ip = process.env.VERCEL
    ? String(req.headers['x-forwarded-for'] ?? 'unknown')
        .split(',')[0]
        .trim()
    : (req.socket.remoteAddress ?? 'local');
  const key = createHash('sha256').update(ip).digest('hex');
  const bucket = buckets.get(key) ?? { count: 0, until: now + 60_000 };
  if (bucket.count >= 6 || active >= 2 || buckets.size >= 2000)
    throw new ApiError(429, 'Mochi needs a short rest. Please try again in a minute.');
  bucket.count++;
  buckets.set(key, bucket);
}
async function readJson(req: ApiRequest): Promise<unknown> {
  if (!String(req.headers['content-type']).startsWith('application/json'))
    throw new ApiError(415, 'Send a sky photo in the supported format.');
  if (Number(req.headers['content-length'] ?? 0) > MAX_BODY_BYTES)
    throw new ApiError(413, 'That sky photo is too large. Try a smaller one.');
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES)
      throw new ApiError(413, 'That sky photo is too large.');
    try {
      return JSON.parse(raw);
    } catch {
      throw new ApiError(400, 'The sky request could not be read.');
    }
  }
  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_BODY_BYTES) throw new ApiError(413, 'That sky photo is too large.');
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'The sky request could not be read.');
  }
}
export async function identificationHandler(req: ApiRequest, res: ServerResponse) {
  let acquired = false;
  const controller = new AbortController();
  const disconnected = () => {
    if (!res.writableEnded) controller.abort();
  };
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw new ApiError(405, 'Use a photo request to check the sky.');
    }
    const origin = req.headers.origin;
    if (origin) {
      let url: URL;
      try {
        url = new URL(origin);
      } catch {
        throw new ApiError(403, 'Open the expedition from CELESTIAL.');
      }
      if (!['https:', 'http:'].includes(url.protocol) || url.host !== req.headers.host)
        throw new ApiError(403, 'Open the expedition from CELESTIAL.');
    }
    limit(req);
    active++;
    acquired = true;
    res.once('close', disconnected);
    send(res, 200, await identifyWithGemma(await readJson(req), { signal: controller.signal }));
  } catch (error) {
    if (!controller.signal.aborted && !res.writableEnded) {
      const failure =
        error instanceof ApiError
          ? error
          : new ApiError(502, 'Mochi lost the signal. Please try again.');
      if (failure.status === 429) res.setHeader('Retry-After', '60');
      send(res, failure.status, { error: failure.message });
    }
  } finally {
    if (acquired) active--;
    res.removeListener('close', disconnected);
  }
}
export function configHandler(req: ApiRequest, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    send(res, 405, { error: 'Use GET for sky service status.' });
    return;
  }
  send(res, 200, publicConfig());
}
