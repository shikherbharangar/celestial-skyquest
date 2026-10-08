import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  configuredModel,
  identifyWithGemma,
  parseModelResult,
  plausibleCandidates,
  publicConfig,
  validatePayload,
} from '../../server/identify';
import { discover, initialState, isGameState } from '../../src/game/progression';
import { readFileSync } from 'node:fs';

const now = Date.now();
const valid = () => ({
  image: { data: readFileSync('public/icon-192.png').toString('base64'), mimeType: 'image/png' },
  candidates: ['moon', 'jupiter', 'saturn'],
  context: { time: new Date(now).toISOString() },
});
const env = { GEMMA_API_KEY: 'test-only-key', GEMMA_MODEL: 'gemma-4-26b-a4b-it' };
const response = (text: string, status = 200) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('live request validation', () => {
  it('exposes configuration availability without leaking secrets', () => {
    expect(publicConfig({})).toMatchObject({ liveAvailable: false });
    expect(publicConfig(env)).toEqual({
      liveAvailable: true,
      provider: 'gemma',
      model: 'gemma-4-26b-a4b-it',
    });
    expect(JSON.stringify(publicConfig(env))).not.toContain('test-only-key');
  });
  it('accepts real image signatures and rounds the optional position', () => {
    const body = validatePayload(
      {
        ...valid(),
        context: { time: new Date(now).toISOString(), latitude: 28.637, longitude: 77.241 },
      },
      now,
    );
    expect(body.context).toMatchObject({ latitude: 28.6, longitude: 77.2 });
  });
  it.each([
    null,
    { ...valid(), image: { data: 'not base64', mimeType: 'image/png' } },
    {
      ...valid(),
      image: {
        data: Buffer.from('this is not a photograph').toString('base64'),
        mimeType: 'image/png',
      },
    },
    { ...valid(), candidates: ['earth'] },
    { ...valid(), context: { time: 'yesterday' } },
    { ...valid(), context: { time: new Date(now - 2 * 86_400_000).toISOString() } },
    { ...valid(), context: { time: new Date(now).toISOString(), latitude: 91, longitude: 0 } },
    { ...valid(), context: { time: new Date(now).toISOString(), latitude: 28 } },
  ])('rejects malformed requests before a model call', (value) => {
    expect(() => validatePayload(value, now)).toThrow(ApiError);
  });
  it('limits image bytes before decoding or sending upstream', () => {
    expect(() =>
      validatePayload(
        { ...valid(), image: { data: 'A'.repeat(2_700_004), mimeType: 'image/png' } },
        now,
      ),
    ).toThrow();
  });
  it('prevents arbitrary models or path injection', () => {
    expect(() => configuredModel({ ...env, GEMMA_MODEL: '../private-model?key=bad' })).toThrow();
  });
  it('never includes below-horizon solar objects when location is supplied', () => {
    const body = validatePayload(
      {
        ...valid(),
        context: { time: new Date(now).toISOString(), latitude: 28.6, longitude: 77.2 },
      },
      now,
    );
    const opposite = validatePayload(
      {
        ...valid(),
        context: { time: new Date(now).toISOString(), latitude: -28.6, longitude: -102.8 },
      },
      now,
    );
    const here = plausibleCandidates(body),
      there = plausibleCandidates(opposite);
    expect(here.every((id) => !there.includes(id))).toBe(true);
  });
});

describe('live model outcomes', () => {
  it('parses the final answer separately from model thought parts', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  { text: 'Internal analysis, not JSON.', thought: true },
                  { text: '{"object":null,"confidence":0,"distinctiveFeatures":false}' },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    expect(await identifyWithGemma(valid(), { env, fetch: request, now })).toMatchObject({
      object: null,
      confidence: 0,
      provider: 'gemma',
    });
  });
  it('requires distinctive evidence, not confidence alone', () => {
    expect(
      parseModelResult('{"object":"jupiter","confidence":0.99,"distinctiveFeatures":false}', [
        'jupiter',
      ]),
    ).toMatchObject({ object: null, provider: 'gemma' });
    expect(
      parseModelResult('{"object":"jupiter","confidence":0.6,"distinctiveFeatures":true}', [
        'jupiter',
      ]),
    ).toMatchObject({ object: null });
  });
  it('rejects hallucinated targets and malformed model output', () => {
    expect(
      parseModelResult('{"object":"pluto","confidence":1,"distinctiveFeatures":true}', ['jupiter']),
    ).toMatchObject({ object: null });
    expect(() => parseModelResult('I think Jupiter', ['jupiter'])).toThrow();
    expect(() =>
      parseModelResult('{"object":"jupiter","confidence":1.5,"distinctiveFeatures":true}', [
        'jupiter',
      ]),
    ).toThrow();
  });
  it('uses curated facts and only sends credentials in the provider header', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        response('```json\n{"object":"moon","confidence":0.95,"distinctiveFeatures":true}\n```'),
      );
    const result = await identifyWithGemma(valid(), { env, fetch: request, now });
    expect(result).toMatchObject({ object: 'moon', provider: 'gemma' });
    expect(result.fact).toContain('3.8 cm');
    expect(request.mock.calls[0][0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent',
    );
    expect(request.mock.calls[0][1].headers['x-goog-api-key']).toBe('test-only-key');
    expect(request.mock.calls[0][1].body).not.toContain('test-only-key');
    expect(JSON.parse(request.mock.calls[0][1].body).contents[0].parts[1].inlineData.mimeType).toBe(
      'image/png',
    );
  });
  it('fails explicitly when no credential is configured, without a mock result', async () => {
    const request = vi.fn();
    await expect(
      identifyWithGemma(valid(), { env: {}, fetch: request, now }),
    ).rejects.toMatchObject({ status: 503 });
    expect(request).not.toHaveBeenCalled();
  });
  it('returns uncertainty when the provider blocks or cannot describe a photo', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response('{"promptFeedback":{"blockReason":"OTHER"}}', { status: 200 }),
      );
    expect(await identifyWithGemma(valid(), { env, fetch: request, now })).toMatchObject({
      object: null,
      confidence: 0,
      provider: 'gemma',
    });
  });
  it.each([
    [401, 503],
    [403, 503],
    [404, 503],
    [429, 429],
    [500, 502],
  ])('handles upstream HTTP %i without exposing provider details', async (status, expected) => {
    const request = vi
      .fn()
      .mockResolvedValue(new Response('private provider diagnostic', { status }));
    await expect(identifyWithGemma(valid(), { env, fetch: request, now })).rejects.toMatchObject({
      status: expected,
    });
  });
  it('upgrades a practice record to a live suggestion without awarding duplicate XP', () => {
    const practice = discover(initialState(), 'moon');
    const live = discover(practice, 'moon', new Date(), 'gemma');
    expect(live.xp).toBe(100);
    expect(live.discoveries.find((d) => d.id === 'moon')?.source).toBe('gemma');
    expect(isGameState(live)).toBe(true);
    expect(discover(live, 'moon').discoveries.find((d) => d.id === 'moon')?.source).toBe('gemma');
  });
});
