import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  Eye,
  Flame,
  LockKeyhole,
  Moon,
  Orbit,
  Rocket,
  Sparkles,
  Telescope,
} from 'lucide-react';
import { OBJECTS, PLANETS, objectById } from '../data/astronomy';
import { achievements } from '../game/progression';
import { Planet } from '../components/Art';
import { Button, Modal, Tag } from '../components/ui';
import type { GameState, ObjectId } from '../types';

export function Collection({
  game,
  onHunt,
  onMission,
}: {
  game: GameState;
  onHunt: (id: ObjectId) => void;
  onMission: (id: ObjectId) => void;
}) {
  const [filter, setFilter] = useState<'planets' | 'beyond'>('planets');
  const [selected, setSelected] = useState<ObjectId | null>(null);
  const objects = filter === 'planets' ? PLANETS : OBJECTS.filter((o) => o.kind !== 'planet');
  const count = game.discoveries.filter((d) => objects.some((o) => o.id === d.id)).length;
  const chosen = selected ? objectById(selected) : null;
  const discovery = game.discoveries.find((d) => d.id === selected);
  const icons = {
    moon: Moon,
    orbit: Orbit,
    stars: Sparkles,
    flame: Flame,
    rocket: Rocket,
    eye: Eye,
  };
  return (
    <div className="collection-screen">
      <div className="screen-intro left">
        <div className="eyebrow">KEEPSAKES FROM THE COSMOS</div>
        <h1>
          Your pocket <em>universe.</em>
        </h1>
        <p>Every little light has a story. These are yours.</p>
      </div>
      <div className="collection-toolbar">
        <div className="segmented" role="group" aria-label="Collection category">
          <button
            aria-pressed={filter === 'planets'}
            className={filter === 'planets' ? 'active' : ''}
            onClick={() => setFilter('planets')}
          >
            <Orbit size={16} /> Solar system
          </button>
          <button
            aria-pressed={filter === 'beyond'}
            className={filter === 'beyond' ? 'active' : ''}
            onClick={() => setFilter('beyond')}
          >
            <Sparkles size={16} /> Beyond & nearby
          </button>
        </div>
        <span className="collection-count">
          <strong>{count}</strong> / {objects.length} collected
        </span>
      </div>
      <div className="collection-grid">
        {objects.map((object, i) => {
          const found = game.discoveries.find((d) => d.id === object.id);
          return (
            <button
              className={`collectible ${found ? 'collected paper' : 'locked'}`}
              key={object.id}
              onClick={() => setSelected(object.id)}
              aria-label={`${object.name}, ${found ? 'collected, view discovery' : 'undiscovered, view hint'}`}
            >
              <div className="collectible-top">
                <span>N° {String(i + (filter === 'planets' ? 1 : 9)).padStart(3, '0')}</span>
                {found ? <Check size={15} /> : <LockKeyhole size={14} />}
              </div>
              <Planet id={object.id} />
              <h2>{object.name}</h2>
              <span className="collectible-type">
                {found
                  ? found.source === 'home'
                    ? 'OUR PALE BLUE DOT'
                    : (found.source === 'gemma' ? 'AI SUGGESTED · ' : 'DEMO · ') +
                      object.rarity.toUpperCase()
                  : object.difficulty}
              </span>
              <div className="collectible-bottom">
                {found ? (
                  <span>
                    {found.source === 'home'
                      ? 'Your adventure starts here'
                      : 'A little wonder, kept forever'}
                  </span>
                ) : (
                  <>
                    <span>Waiting to be found</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="collection-footnote">
        {filter === 'planets'
          ? 'Earth is your starting keepsake. Collect the other seven worlds in practice expeditions.'
          : 'The Moon belongs here with the stars, constellations, and distant wonders.'}{' '}
        Demo finds are practice collectibles. AI suggestions are not verified observations.
      </div>
      <section className="achievement-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LITTLE WINS, BIG FEELINGS</span>
            <h2>Your explorer badges</h2>
          </div>
          <span className="quiet-caption">
            {achievements(game).filter((a) => a.earned).length} / 6 EARNED
          </span>
        </div>
        <div className="achievement-grid">
          {achievements(game).map((badge) => {
            const Icon = icons[badge.icon as keyof typeof icons];
            return (
              <div key={badge.id} className={`achievement ${badge.earned ? 'earned' : ''}`}>
                <span className="badge-seal">
                  <Icon size={23} />
                  {badge.earned && <Check size={11} className="badge-check" />}
                </span>
                <div>
                  <h3>{badge.name}</h3>
                  <p>{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {chosen && (
        <Modal title={chosen.name} onClose={() => setSelected(null)} className="object-modal">
          <div className="object-modal-art">
            <Planet id={chosen.id} />
          </div>
          <Tag>
            {discovery
              ? discovery.source === 'home'
                ? 'HOME WORLD'
                : discovery.source === 'gemma'
                  ? 'AI SUGGESTED MATCH'
                  : 'DEMO DISCOVERY'
              : 'YET TO BE DISCOVERED'}{' '}
            · {chosen.rarity}
          </Tag>
          <p className="modal-fact">{discovery ? chosen.fact : chosen.hint}</p>
          {discovery && (
            <>
              <p className="quiet-caption">
                Added{' '}
                {new Date(discovery.date).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <details className="object-details">
                <summary>
                  A closer look <Telescope size={15} />
                </summary>
                <dl>
                  <div>
                    <dt>Distance reference</dt>
                    <dd>{chosen.distance}</dd>
                  </div>
                  <div>
                    <dt>Diameter</dt>
                    <dd>{chosen.diameter}</dd>
                  </div>
                  <div>
                    <dt>Gravity</dt>
                    <dd>{chosen.gravity}</dd>
                  </div>
                  <div>
                    <dt>How to see it</dt>
                    <dd>{chosen.difficulty}</dd>
                  </div>
                </dl>
                <p>
                  Rounded reference values. Planet distances are averages from the Sun. Sources are
                  in the explorer’s guide.
                </p>
              </details>
            </>
          )}
          {discovery && chosen.id !== 'earth' ? (
            <Button
              className="button-dark"
              onClick={() => {
                setSelected(null);
                onMission(chosen.id);
              }}
            >
              <Rocket size={17} /> Build a mission
            </Button>
          ) : chosen.id !== 'earth' ? (
            <Button
              className="button-dark"
              onClick={() => {
                setSelected(null);
                onHunt(chosen.id);
              }}
            >
              <Compass size={17} /> Find {chosen.name} <ArrowRight size={17} />
            </Button>
          ) : (
            <Button className="button-dark" onClick={() => setSelected(null)}>
              Home, sweet home <Check size={16} />
            </Button>
          )}
        </Modal>
      )}
    </div>
  );
}
