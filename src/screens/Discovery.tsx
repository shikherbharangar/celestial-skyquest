import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, Rocket, Star } from 'lucide-react';
import { Planet, Mochi, Sparkle } from '../components/Art';
import { Button, Tag } from '../components/ui';
import { objectById } from '../data/astronomy';
import { playSound } from '../services/audio';
import type { ObjectId } from '../types';

export function DiscoveryScreen({
  target,
  photo,
  isNew,
  provider = 'demo',
  onMission,
  onCollection,
  onNext,
}: {
  target: ObjectId;
  photo: string;
  isNew: boolean;
  provider?: 'demo' | 'gemma';
  onMission: () => void;
  onCollection: () => void;
  onNext: () => void;
}) {
  const object = objectById(target);
  const reduced = useReducedMotion();
  const [xp, setXp] = useState(0);
  const [ready, setReady] = useState(false);
  const reward = isNew ? object.xp : 0;
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let frame = 0;
    timers.push(
      setTimeout(
        () => {
          playSound('discovery');
        },
        reduced ? 0 : 1000,
      ),
    );
    timers.push(
      setTimeout(
        () => {
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / (reduced ? 1 : 650));
            setXp(Math.round(reward * (1 - (1 - progress) ** 3)));
            if (progress < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
          playSound('xp');
        },
        reduced ? 0 : 1500,
      ),
    );
    timers.push(setTimeout(() => setReady(true), reduced ? 50 : 2300));
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
    };
  }, [reward, reduced]);
  const delay = (value: number) => (reduced ? 0 : value);
  return (
    <div className="discovery-screen narrow-screen">
      <div className="discovery-heading">
        <motion.div
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(1.3) }}
        >
          <Sparkle />
          {isNew ? 'NEW DISCOVERY!' : 'AN OLD FRIEND, FOUND AGAIN'}
          <Sparkle />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay(1.45) }}
        >
          {isNew ? 'Hello, ' : 'Hello again, '}
          <em>{object.name}.</em>
        </motion.h1>
      </div>
      <div className="reveal-stage">
        <motion.img
          className="collapsing-photo"
          src={photo}
          alt=""
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: [1, 0.94, 0.06], opacity: [1, 1, 0], rotate: [0, -3, 7] }}
          transition={{ duration: reduced ? 0 : 0.7 }}
        />
        <motion.div
          className="reveal-orbit"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0], rotate: 160 }}
          transition={{ duration: reduced ? 0 : 1.2 }}
        >
          <Sparkle />
          <Sparkle />
          <Sparkle />
        </motion.div>
        <motion.div
          className="discovery-card paper"
          initial={{ scale: 0.03, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: [0, -3, 3, -2, 0] }}
          transition={{
            delay: delay(0.55),
            duration: reduced ? 0 : 0.55,
            scale: { type: 'spring', stiffness: 210, damping: 17, delay: delay(0.55) },
          }}
        >
          <div className="discovery-card-top">
            <span className="eyebrow">CELESTIAL FIELD JOURNAL</span>
            <span>
              N°{' '}
              {String(
                [
                  'mercury',
                  'venus',
                  'earth',
                  'mars',
                  'jupiter',
                  'saturn',
                  'uranus',
                  'neptune',
                  'moon',
                  'sirius',
                  'orion',
                  'pleiades',
                  'andromeda',
                ].indexOf(target) + 1,
              ).padStart(3, '0')}
            </span>
          </div>
          <div className="discovery-planet-area">
            <div className="discovery-planet-orbit" />
            <motion.div
              initial={{ y: 40, scale: 0.2, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 250, damping: 13, delay: delay(1.05) }}
            >
              <Planet id={target} />
            </motion.div>
            <span className="specimen-label">a tiny piece of the infinite</span>
          </div>
          <h2>{object.name}</h2>
          <Tag className="rarity-tag">
            {object.rarity} · {object.kind === 'deep-sky' ? 'DEEP SKY' : object.kind}
          </Tag>
          <div className="discovery-fact">
            <span className="eyebrow">ONE LITTLE WONDER</span>
            <p>{object.fact}</p>
          </div>
          <div className="discovery-stamp">
            <Check size={13} /> {provider === 'gemma' ? 'AI SUGGESTED MATCH' : 'DEMO DISCOVERY'}{' '}
            <span>
              {new Intl.DateTimeFormat('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </div>
        </motion.div>
        <div className="burst-particles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6;
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos(angle) * (i % 2 ? 215 : 180),
                  y: Math.sin(angle) * 190,
                  opacity: [0, 1, 0],
                  scale: [0, 1.1, 0.5],
                  rotate: i * 35,
                }}
                transition={{ duration: reduced ? 0 : 1.3, delay: delay(1.05) }}
              >
                <Sparkle />
              </motion.span>
            );
          })}
        </div>
        <motion.div
          className="celebrating-mochi"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 6 }}
          transition={{ delay: delay(1.4), type: 'spring', damping: 12 }}
        >
          <Mochi mood="celebrating" />
          <span>you found it!</span>
        </motion.div>
      </div>
      <motion.div
        className="discovery-xp"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay(1.5) }}
      >
        <Star size={20} fill="currentColor" />
        <strong>+{xp} XP</strong>
        <span>
          {isNew ? 'Curiosity looks good on you.' : 'Already in your journal. Still a wonder.'}
        </span>
      </motion.div>
      <div className={`discovery-actions ${ready ? 'ready' : ''}`} aria-live="polite">
        {ready && (
          <>
            <motion.div
              animate={reduced ? {} : { y: [0, -5, 0] }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              <Button className="button-cream" onClick={onMission}>
                <Rocket size={18} /> Build a mission <ArrowRight size={18} />
              </Button>
            </motion.div>
            <div className="discovery-secondary">
              <button className="text-link" onClick={onCollection}>
                <BookOpen size={16} /> Open field journal
              </button>
              <button className="text-link" onClick={onNext}>
                Hunt another <ArrowRight size={16} />
              </button>
            </div>
            <p className="quiet-caption">
              {provider === 'gemma'
                ? 'AI suggestion saved · photo processed by Google AI Studio'
                : 'Practice find saved on this device · no photo uploaded'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
