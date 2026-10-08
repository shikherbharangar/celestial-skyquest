import { objectById } from '../data/astronomy';
import { imageBase64 } from './photo';
import type { Identification, IdentificationInput, IdentificationProvider } from '../types';

export const demoProvider: IdentificationProvider = {
  async identify(input, signal) {
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      const abort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort);
        resolve();
      }, 1700);
      signal?.addEventListener('abort', abort, { once: true });
    });
    // Practice always returns the selected target, regardless of the photo.
    const id = input.candidates[0];
    if (!id || input.demoSignal === 'weak')
      return { object: null, confidence: 0.28, fact: '', rarity: null, provider: 'demo' };
    const object = objectById(id);
    return {
      object: id,
      confidence: 0.92,
      fact: object.fact,
      rarity: object.rarity,
      provider: 'demo',
    };
  },
};

export async function identifySkyObject(
  input: IdentificationInput,
  provider: IdentificationProvider = demoProvider,
  signal?: AbortSignal,
): Promise<Identification> {
  const result = await provider.identify(input, signal);
  if (!Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1)
    throw new Error('The sky response was incomplete. Please try another photo.');
  if (result.object && !input.candidates.includes(result.object))
    return { ...result, object: null, confidence: 0 };
  return result;
}

// Keep the Google key on the server. The browser only calls our API.
export function createGemmaProvider(endpoint: string): IdentificationProvider {
  if (!endpoint.startsWith('/') || endpoint.startsWith('//'))
    throw new Error('Use a same-origin identification endpoint.');
  return {
    async identify(input, signal) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: { data: await imageBase64(input.image), mimeType: input.image.type },
          candidates: input.candidates,
          context: input.context,
        }),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(25_000)])
          : AbortSignal.timeout(25_000),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body && typeof body.error === 'string'
            ? body.error.slice(0, 240)
            : 'Mochi lost the live signal. Try again or choose practice mode.',
        );
      }
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== 'object' ||
        !('object' in result) ||
        !('confidence' in result) ||
        typeof result.confidence !== 'number' ||
        !Number.isFinite(result.confidence) ||
        result.confidence < 0 ||
        result.confidence > 1
      )
        throw new Error('Mochi needs a clearer response. Please try again.');
      const id = input.candidates.find((candidate) => candidate === result.object);
      return {
        object: id ?? null,
        confidence: id ? result.confidence : 0,
        fact: id ? objectById(id).fact : '',
        rarity: id ? objectById(id).rarity : null,
        provider: 'gemma',
      };
    },
  };
}
