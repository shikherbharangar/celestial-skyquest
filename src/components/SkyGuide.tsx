import { useState } from 'react';
import { Compass, ExternalLink, MapPin, RefreshCw, Sun, Telescope } from 'lucide-react';
import { Button, Modal, Tag } from './ui';
import { Planet } from './Art';
import { SOURCES, objectById } from '../data/astronomy';
import { visibleCandidates } from '../services/sky';
import type { ObjectId, ObservationContext, SkyCandidate } from '../types';

export function SkyGuide({
  onClose,
  context,
  onContext,
  onChoose,
}: {
  onClose: () => void;
  context: ObservationContext;
  onContext: (context: ObservationContext) => void;
  onChoose: (id: ObjectId) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    context.latitude !== undefined ? 'ready' : 'idle',
  );
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ candidates: SkyCandidate[]; daylight: boolean } | null>(
    () =>
      context.latitude !== undefined && context.longitude !== undefined
        ? visibleCandidates(context.latitude, context.longitude)
        : null,
  );
  function locate() {
    if (!navigator.geolocation) {
      setError('This browser can’t share location. Practice expeditions are still available.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Math.round(position.coords.latitude * 10) / 10;
        const longitude = Math.round(position.coords.longitude * 10) / 10;
        const time = new Date();
        onContext({ latitude, longitude, time });
        setResult(visibleCandidates(latitude, longitude, time));
        setStatus('ready');
      },
      () => {
        setStatus('error');
        setError(
          'Location wasn’t available. Allow it in your browser to check the local sky, or keep exploring in practice mode.',
        );
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }
  return (
    <Modal title="What’s up, little explorer?" onClose={onClose} className="sky-guide-modal">
      <p className="modal-description">A real sky check for your next moment outside.</p>
      <div className="guide-location">
        <MapPin size={21} />
        <div>
          <h3>{result ? 'Your approximate local sky' : 'Let’s find your patch of sky'}</h3>
          <p>Calculated on your device. Approximate coordinates stay here for this visit.</p>
        </div>
      </div>
      <Button className="button-dark" onClick={locate} disabled={status === 'loading'}>
        {result ? <RefreshCw size={16} /> : <MapPin size={16} />}{' '}
        {status === 'loading'
          ? 'Finding your sky…'
          : result
            ? 'Refresh sky position'
            : 'Use approximate location'}
      </Button>
      {status === 'error' && (
        <p className="inline-alert" role="status">
          {error}
        </p>
      )}
      {result && (
        <div className="sky-results">
          <div className="section-heading">
            <span className="eyebrow">ABOVE 10° RIGHT NOW</span>
            <Tag>REAL CALCULATIONS</Tag>
          </div>
          {result.daylight && (
            <p className="daylight-note">
              <Sun size={17} /> It’s daylight or bright twilight. Above the horizon doesn’t mean
              visible. Wait for darkness; never point optics at the Sun.
            </p>
          )}
          {result.candidates.length ? (
            result.candidates.map((candidate) => (
              <button
                key={candidate.id}
                className="sky-candidate"
                onClick={() => {
                  onChoose(candidate.id);
                  onClose();
                }}
              >
                <Planet id={candidate.id} />
                <span>
                  <strong>{objectById(candidate.id).name}</strong>
                  <small>{objectById(candidate.id).difficulty}</small>
                </span>
                <span className="sky-bearing">
                  <Compass size={14} />
                  {candidate.direction} · {candidate.altitude}° up
                </span>
              </button>
            ))
          ) : (
            <p>
              No planets or Moon clear our 10° horizon cutoff right now. Try again later; the sky is
              always moving.
            </p>
          )}
          <p className="quiet-caption">
            Updated{' '}
            {new Date(context.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            Directions are compass bearings, not phone orientation. Clouds, buildings, brightness,
            and terrain affect visibility.
          </p>
        </div>
      )}
      <details className="guide-tips" open={!result}>
        <summary>
          <Telescope size={16} /> A better first night outside
        </summary>
        <ul>
          <li>Give your eyes 15–20 minutes to adjust. Dim your screen.</li>
          <li>Choose a safe, open spot and watch where you step.</li>
          <li>
            Phone photos rarely resolve planets. Binoculars or a telescope help your eyes more than
            a zoom slider.
          </li>
          <li>
            The practice identifier demonstrates the game; it doesn’t verify what’s in a photo.
          </li>
        </ul>
      </details>
      <details className="guide-sources">
        <summary>Our little science bookshelf</summary>
        <p>
          Reference facts are rounded. Sky positions use Astronomy Engine, current time, and
          approximate location.
        </p>
        {SOURCES.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
            {source.name}
            <ExternalLink size={12} />
          </a>
        ))}
      </details>
    </Modal>
  );
}
