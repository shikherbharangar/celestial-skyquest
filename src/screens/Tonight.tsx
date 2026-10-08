import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  LockKeyhole,
  Orbit,
  Sparkles,
  Star,
} from 'lucide-react';
import { objectById, PLANETS } from '../data/astronomy';
import { rankFor } from '../game/progression';
import { Button, Tag } from '../components/ui';
import { Planet, SkyScene, Sparkle } from '../components/Art';
import type { GameState, ObjectId } from '../types';

export function Tonight({
  game,
  target,
  onBegin,
  onCollection,
  onMissions,
  onGuide,
}: {
  game: GameState;
  target: ObjectId;
  onBegin: () => void;
  onCollection: () => void;
  onMissions: () => void;
  onGuide: () => void;
}) {
  const object = objectById(target);
  const count = game.discoveries.filter((d) => PLANETS.some((p) => p.id === d.id)).length;
  const rank = rankFor(game.xp);
  const discovered = game.discoveries.filter((d) => d.source !== 'home').length;
  return (
    <div className="tonight-screen">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> A SMALL ADVENTURE UNDER A BIG SKY
          </div>
          <h1>
            Little explorer,
            <br />
            <em>big universe.</em>
            <Sparkle className="heading-spark" />
          </h1>
          <p>
            There’s a whole sky of wonders out there.
            <br className="desktop-break" />{' '}
            {discovered
              ? 'There’s always another little light to follow.'
              : 'Let’s find your first little piece of it.'}
          </p>
          <div className="hero-note">
            <Sparkle className="note-star" /> No spaceship required. Just a little curiosity.
          </div>
        </div>
        <SkyScene target={target} />
      </section>
      <div className="home-grid">
        <section className="hunt-card paper">
          <div className="card-topline">
            <span className="eyebrow">
              <Compass size={15} /> TONIGHT’S HUNT
            </span>
            <Tag>
              <span className="status-dot" /> DEMO EXPEDITION
            </Tag>
          </div>
          <div className="hunt-main">
            <div className="hunt-object">
              <Planet id={target} />
              <span className="orbit-dot" />
            </div>
            <div>
              <div className="object-kicker">A LITTLE LIGHT WORTH FINDING</div>
              <h2>
                Find {object.name}
                <Sparkle />
              </h2>
              <div className="hunt-rewards">
                <span className="rarity">
                  <span />
                  {object.rarity} discovery
                </span>
                <span className="xp-reward">
                  <Star size={13} fill="currentColor" /> +{object.xp} XP
                </span>
              </div>
            </div>
          </div>
          <p className="hunt-hint">{object.hint}</p>
          <Button className="button-dark begin-button" onClick={onBegin}>
            <Compass size={18} />
            <span>Begin expedition</span>
            <ArrowRight size={19} />
          </Button>
          <div className="card-bottomline">
            <span>ONE PHOTO. ONE NEW PERSPECTIVE.</span>
            <span>01 / ∞</span>
          </div>
        </section>
        <section className="journal-preview">
          <div className="section-heading">
            <span className="eyebrow">
              <Orbit size={15} /> YOUR COSMIC KEEPSAKES
            </span>
            <button className="text-link" onClick={onCollection}>
              Field journal <ArrowUpRight size={16} />
            </button>
          </div>
          <h2>
            A solar system
            <br />
            of your very own.
          </h2>
          <div className="planet-row">
            {PLANETS.map((planet) => {
              const found = game.discoveries.some((d) => d.id === planet.id);
              return (
                <button
                  key={planet.id}
                  className={`mini-planet ${found ? 'found' : ''}`}
                  onClick={onCollection}
                  aria-label={`${planet.name}, ${found ? 'collected' : 'undiscovered'}`}
                >
                  <Planet id={planet.id} />
                  {found && <span className="collected-dot" />}
                </button>
              );
            })}
          </div>
          <div className="collection-progress">
            <span>
              <strong>{count}</strong> / 8 planets discovered
            </span>
            <span>{Math.round((count / 8) * 100)}%</span>
          </div>
          <div className="thin-progress">
            <span style={{ width: `${(count / 8) * 100}%` }} />
          </div>
          <p className="home-world-note">Earth is home. The rest is an adventure.</p>
          <button className="unlock-note" onClick={onMissions}>
            <span className="unlock-icon">
              {discovered ? <Sparkles size={21} /> : <LockKeyhole size={20} />}
            </span>
            <span>
              <small>{discovered ? 'YOUR NEXT GREAT IDEA' : 'A LITTLE SOMETHING AHEAD'}</small>
              <strong>
                {discovered ? 'Your first mission is waiting' : 'First discovery → Mission builder'}
              </strong>
            </span>
            <ArrowRight size={17} />
          </button>
        </section>
      </div>
      <div className="bottom-note">
        <span>
          <span className="status-dot" /> {rank.name} field notes ·{' '}
          {new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date())}
        </span>
        <button onClick={onGuide}>
          What’s actually up tonight? <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}
