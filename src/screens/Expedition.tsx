import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  Compass,
  ImagePlus,
  ScanLine,
  Sparkles,
  Telescope,
  Upload,
} from 'lucide-react';
import { BackButton, Button, Tag } from '../components/ui';
import { Mochi, Planet, Sparkle } from '../components/Art';
import { HUNT_ORDER, objectById } from '../data/astronomy';
import { createGemmaProvider, identifySkyObject } from '../services/identification';
import { prepareSkyPhoto } from '../services/photo';
import { useLiveService } from '../hooks/useLiveService';
import { playSound } from '../services/audio';
import type { Identification, ObjectId, ObservationContext } from '../types';

export function Expedition({
  target,
  onTarget,
  onBack,
  onDiscover,
  onGuide,
  context,
}: {
  target: ObjectId;
  onTarget: (id: ObjectId) => void;
  onBack: () => void;
  onDiscover: (result: Identification, photo: string) => void;
  onGuide: () => void;
  context: ObservationContext;
}) {
  const object = objectById(target);
  const [mode, setMode] = useState<'practice' | 'live'>('practice');
  const live = useLiveService();
  const [stage, setStage] = useState<'ready' | 'scan' | 'weak'>('ready');
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const urls = useRef<string[]>([]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      urls.current.forEach(URL.revokeObjectURL);
    };
  }, []);
  async function scan(blob: Blob, url: string, weak = false, practice = mode === 'practice') {
    if (busy.current || !mounted.current) return;
    busy.current = true;
    controller.current?.abort();
    const activeController = new AbortController();
    controller.current = activeController;
    setPhoto(url);
    setError('');
    setStage('scan');
    playSound('scan');
    try {
      const result = await identifySkyObject(
        {
          image: blob,
          candidates: practice ? [target] : HUNT_ORDER,
          context: { ...context, time: new Date() },
          demoSignal: weak ? 'weak' : 'clear',
        },
        practice ? undefined : createGemmaProvider('/api/identify'),
        activeController.signal,
      );
      if (result.confidence < 0.65 || !result.object) {
        setStage('weak');
      } else {
        const revealPhoto = url.startsWith('blob:')
          ? await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error('Could not read photo.'));
              reader.readAsDataURL(blob);
            })
          : url;
        if (!activeController.signal.aborted && mounted.current) onDiscover(result, revealPhoto);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Mochi lost the signal. Please try again.');
      setStage('ready');
    } finally {
      busy.current = false;
    }
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(
        file.type,
      )
    ) {
      setError('Try a JPG, PNG, WebP, AVIF, or HEIC sky photo.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('That photo is a little big. Pick one under 15 MB.');
      return;
    }
    if (!file.size) {
      setError('That photo seems empty. Try another one.');
      return;
    }
    try {
      const photo = mode === 'live' ? await prepareSkyPhoto(file) : file;
      if (!mounted.current) return;
      const url = URL.createObjectURL(photo);
      urls.current.push(url);
      await scan(photo, url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'That photo could not be prepared.');
    }
  }
  async function sample(weak = false) {
    setMode('practice');
    try {
      const response = await fetch('/sample-sky.svg');
      if (!response.ok) throw new Error();
      await scan(await response.blob(), '/sample-sky.svg', weak, true);
    } catch {
      setError('The practice sky could not load. Try uploading a photo instead.');
    }
  }
  return (
    <div className="expedition-screen narrow-screen">
      <BackButton onClick={onBack} />
      <div className="screen-intro">
        <div className="eyebrow">
          <Compass size={15} /> EXPEDITION {stage === 'scan' ? 'IN PROGRESS' : 'FIELD KIT'}
        </div>
        <h1>
          {stage === 'weak'
            ? 'A shy little signal.'
            : stage === 'scan'
              ? 'A little closer…'
              : 'Eyes up, explorer.'}
        </h1>
        <p>
          {stage === 'scan'
            ? mode === 'live'
              ? 'Gemma is taking a closer look…'
              : 'Mochi is checking the practice sky…'
            : 'Take a breath. Let your eyes settle into the dark.'}
        </p>
      </div>
      <div className="identification-modes">
        <div className="segmented" role="group" aria-label="Identification mode">
          <button
            aria-pressed={mode === 'practice'}
            className={mode === 'practice' ? 'active' : ''}
            disabled={stage === 'scan'}
            onClick={() => {
              setMode('practice');
              setError('');
              setStage('ready');
            }}
          >
            Practice
          </button>
          <button
            aria-pressed={mode === 'live'}
            className={mode === 'live' ? 'active' : ''}
            disabled={stage === 'scan' || live.status !== 'available'}
            onClick={() => {
              setMode('live');
              setError('');
              setStage('ready');
            }}
          >
            Live Gemma
          </button>
        </div>
        <span className="quiet-caption">
          {live.status === 'checking'
            ? 'Checking live mode…'
            : live.status === 'available'
              ? 'Live mode is set up'
              : 'Live mode isn’t set up yet'}
        </span>
        {live.status === 'unavailable' && (
          <button className="text-link" onClick={() => void live.refresh()}>
            Check connection
          </button>
        )}
      </div>
      {mode === 'live' && (
        <p className="live-consent">
          By choosing a photo in Live Gemma mode, you send a resized copy and the current
          observation time to Google AI Studio for analysis. Approximate location is included only
          if you already shared it in the sky guide. Photo metadata is removed. A match is an AI
          suggestion, not a verified observation.
        </p>
      )}
      <div className="expedition-target">
        <div className="target-planet">
          <Planet id={target} />
        </div>
        <div>
          <span className="eyebrow">YOUR TARGET</span>
          <h2>{object.name}</h2>
        </div>
        <label className="target-select">
          <span className="sr-only">Choose target</span>
          <select
            value={target}
            onChange={(e) => {
              onTarget(e.target.value as ObjectId);
              setStage('ready');
              setPhoto(null);
            }}
            disabled={stage === 'scan'}
          >
            {HUNT_ORDER.map((id) => (
              <option key={id} value={id}>
                {objectById(id).name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
      </div>
      <div className={`viewfinder ${stage}`}>
        <i className="view-corner top-left" />
        <i className="view-corner top-right" />
        <i className="view-corner bottom-left" />
        <i className="view-corner bottom-right" />
        {photo && stage === 'scan' && (
          <img
            className="scan-photo"
            src={photo}
            alt="Your chosen sky"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="viewfinder-stars">
          <Sparkle />
          <Sparkle />
          <Sparkle />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            className="viewfinder-content"
            key={stage}
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.92 }}
          >
            <div className="expedition-mochi">
              <Mochi mood={stage === 'weak' ? 'confused' : 'searching'} />
              {stage === 'scan' && (
                <div className="scanning-orbit">
                  <Sparkle />
                </div>
              )}
            </div>
            <h3>
              {stage === 'weak'
                ? 'SIGNAL WEAK'
                : stage === 'scan'
                  ? 'Mochi is checking the sky…'
                  : 'The best view isn’t on your screen.'}
            </h3>
            <p>
              {stage === 'weak'
                ? 'Mochi isn’t sure yet. Try another shot with a steadier hand.'
                : stage === 'scan'
                  ? 'Give Mochi a moment to look around.'
                  : object.hint}
            </p>
            {stage !== 'scan' && (
              <button className="text-link sky-guide-link" onClick={onGuide}>
                <Telescope size={15} /> Check your local sky <ArrowUpRight size={13} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="viewfinder-caption">
          {stage === 'scan'
            ? mode === 'live'
              ? 'LIVE GEMMA · PHOTO ANALYSIS'
              : 'PRACTICE IDENTIFICATION · NOT PHOTO ANALYSIS'
            : 'LOOK UP. WONDER A LITTLE.'}
        </span>
      </div>
      {error && (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      )}
      {stage === 'scan' ? (
        <div className="scan-progress" role="status">
          <ScanLine size={18} />
          <span>
            {mode === 'live' ? 'Checking your photo with Gemma…' : 'Checking the practice sky…'}
          </span>
          <span className="animated-dots">···</span>
        </div>
      ) : (
        <>
          <div className="photo-actions">
            <Button className="button-cream" onClick={() => camera.current?.click()}>
              <Camera size={19} />
              {stage === 'weak' ? 'Try another sky photo' : 'Take sky photo'}
            </Button>
            <Button
              className="button-outline upload-button"
              onClick={() => upload.current?.click()}
              aria-label="Upload sky photo"
            >
              <Upload size={18} />
              <span>Upload</span>
            </Button>
          </div>
          <input
            ref={camera}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            capture="environment"
            aria-label="Take sky photo"
            onChange={(e) => {
              void choosePhoto(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <input
            ref={upload}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            aria-label="Upload a sky image"
            onChange={(e) => {
              void choosePhoto(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="demo-photo-actions">
            <button onClick={() => void sample()}>
              <ImagePlus size={15} /> Try a practice sky <ArrowIcon />
            </button>
            <button onClick={() => void sample(true)}>Try a faint signal</button>
          </div>
        </>
      )}
      <div className="demo-disclosure">
        <Tag>
          <Sparkles size={12} /> {mode === 'live' ? 'LIVE GEMMA' : 'DEMO MODE'}
        </Tag>
        <p>
          {mode === 'live'
            ? 'A bright dot often isn’t enough to tell what you’ve found. If Gemma can’t make out clear features, we’ll ask you to try again. We don’t save your uploaded photo. Google’s data-use terms apply.'
            : 'Practice always finds your selected target, even if you upload a different photo. It’s a way to try the game, and your photos stay on this device. Choose Live Gemma when you want a photo analysed.'}
        </p>
      </div>
    </div>
  );
}
function ArrowIcon() {
  return <ArrowUpRight size={13} />;
}
