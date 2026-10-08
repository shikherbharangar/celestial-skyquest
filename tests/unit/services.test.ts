import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGemmaProvider,
  demoProvider,
  identifySkyObject,
} from '../../src/services/identification';
import { visibleCandidates } from '../../src/services/sky';
import type { IdentificationInput, IdentificationProvider } from '../../src/types';

const input: IdentificationInput = {
  image: new Blob(['sample'], { type: 'image/png' }),
  candidates: ['jupiter'],
  context: { time: new Date('2026-10-08T12:00:00Z') },
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('honest, replaceable identification', () => {
  it('runs deterministic demo identification and labels its source', async () => {
    vi.useFakeTimers();
    const result = identifySkyObject(input);
    await vi.runAllTimersAsync();
    expect(await result).toMatchObject({
      object: 'jupiter',
      confidence: 0.92,
      provider: 'demo',
      rarity: 'Rare',
    });
  });
  it('treats a weak signal as uncertainty with no object or XP-bearing identity', async () => {
    vi.useFakeTimers();
    const result = identifySkyObject({ ...input, demoSignal: 'weak' });
    await vi.runAllTimersAsync();
    expect(await result).toMatchObject({ object: null, confidence: 0.28 });
  });
  it('does not accept an identity outside the astronomical candidates', async () => {
    const provider: IdentificationProvider = {
      identify: async () => ({
        object: 'saturn',
        confidence: 0.95,
        fact: '',
        rarity: 'Rare',
        provider: 'gemma',
      }),
    };
    expect(await identifySkyObject(input, provider)).toMatchObject({ object: null, confidence: 0 });
  });
  it('rejects invalid confidence instead of showing a certain discovery', async () => {
    const provider: IdentificationProvider = {
      identify: async () => ({
        object: 'jupiter',
        confidence: 2,
        fact: '',
        rarity: 'Rare',
        provider: 'gemma',
      }),
    };
    await expect(identifySkyObject(input, provider)).rejects.toThrow('incomplete');
  });
  it('cancels an expedition when it is abandoned', async () => {
    const controller = new AbortController();
    const pending = demoProvider.identify(input, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('Gemma adapter sends context but uses structured facts rather than generated assertions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          object: 'jupiter',
          confidence: 0.9,
          fact: 'Jupiter is made of cheese',
        }),
      }),
    );
    const result = await identifySkyObject(input, createGemmaProvider('/api/identify'));
    expect(result.fact).toContain('Great Red Spot');
    expect(result.provider).toBe('gemma');
    expect(fetch).toHaveBeenCalledWith(
      '/api/identify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      }),
    );
  });
  it('keeps provider credentials out of cross-origin browser requests', () => {
    expect(() => createGemmaProvider('https://example.com/identify')).toThrow('same-origin');
    expect(() => createGemmaProvider('//example.com/identify')).toThrow('same-origin');
  });
});
describe('real local sky calculations', () => {
  it('distinguishes local noon from midnight at the March equinox', () => {
    expect(visibleCandidates(0, 0, new Date('2026-03-20T12:00:00Z')).daylight).toBe(true);
    expect(visibleCandidates(0, 0, new Date('2026-03-20T00:00:00Z')).daylight).toBe(false);
  });
  it('returns finite, sorted above-horizon positions without Earth as a sky target', () => {
    const result = visibleCandidates(28.6, 77.2, new Date('2026-10-08T18:00:00Z'));
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.map((c) => c.id)).not.toContain('earth');
    for (const candidate of result.candidates) {
      expect(candidate.altitude).toBeGreaterThanOrEqual(10);
      expect(candidate.altitude).toBeLessThanOrEqual(90);
      expect(candidate.azimuth).toBeGreaterThanOrEqual(0);
      expect(candidate.azimuth).toBeLessThanOrEqual(360);
      expect(candidate.direction).toMatch(/^(N|NE|E|SE|S|SW|W|NW)$/);
    }
    expect(result.candidates.map((c) => c.altitude)).toEqual(
      result.candidates.map((c) => c.altitude).sort((a, b) => b - a),
    );
  });
});
