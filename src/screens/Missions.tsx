import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Compass,
  Copy,
  Flag,
  FlaskConical,
  Hammer,
  Heart,
  Orbit,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Zap,
  Bot,
} from 'lucide-react';
import { Mochi, Planet, Sparkle } from '../components/Art';
import { BackButton, Button, Tag } from '../components/ui';
import { objectById } from '../data/astronomy';
import { buildMission } from '../game/missions';
import type { GameState, Mission, MissionChoices, ObjectId } from '../types';

export function Missions({
  game,
  onBuild,
  onHunt,
  onOpen,
}: {
  game: GameState;
  onBuild: (id: ObjectId) => void;
  onHunt: () => void;
  onOpen: (mission: Mission) => void;
}) {
  const targets = game.discoveries.filter(
    (d) => d.source !== 'home' && !game.missions.some((m) => m.target === d.id),
  );
  return (
    <div className="missions-screen">
      <div className="screen-intro left">
        <div className="eyebrow">SMALL EXPLORER. GRAND PLANS.</div>
        <h1>
          Next stop, <em>what if?</em>
        </h1>
        <p>You found a little wonder. Now dream up a way to explore it.</p>
      </div>
      {game.missions.length === 0 && targets.length === 0 ? (
        <div className="mission-empty">
          <div className="empty-art">
            <Mochi mood="idle" />
            <Sparkle />
          </div>
          <h2>
            Every mission starts
            <br />
            with a little curiosity.
          </h2>
          <p>
            Make your first discovery to unlock the mission workshop. Mochi already packed the
            snacks.
          </p>
          <Button className="button-cream" onClick={onHunt}>
            <Compass size={18} /> Find your first wonder <ArrowRight size={18} />
          </Button>
          <span className="quiet-caption">
            <LockIcon /> UNLOCKED WITH YOUR FIRST SKY DISCOVERY
          </span>
        </div>
      ) : (
        <>
          {targets.length > 0 && (
            <section className="available-missions">
              <span className="eyebrow">
                <Sparkles size={15} /> READY FOR YOUR BIG IDEA
              </span>
              <div className="mission-target-grid">
                {targets.map((d) => (
                  <button
                    className="mission-target-card paper"
                    key={d.id}
                    onClick={() => onBuild(d.id)}
                  >
                    <Planet id={d.id} />
                    <div>
                      <span className="eyebrow">MISSION UNLOCKED</span>
                      <h2>{objectById(d.id).name}</h2>
                      <p>Choose a crew. Chase a question.</p>
                    </div>
                    <ArrowRight size={21} />
                  </button>
                ))}
              </div>
            </section>
          )}
          {game.missions.length > 0 && (
            <section className="mission-archive">
              <div className="section-heading">
                <h2>Your flight plans</h2>
                <Tag>{game.missions.length} LAUNCHED</Tag>
              </div>
              <div className="mission-target-grid">
                {game.missions.map((m) => (
                  <button className="archived-mission" key={m.id} onClick={() => onOpen(m)}>
                    <span className="archive-icon">
                      <Rocket size={25} />
                    </span>
                    <div>
                      <span className="eyebrow">{m.name}</span>
                      <h3>{m.subtitle}</h3>
                      <span className="quiet-caption">
                        {m.crew === 'robotic' ? 'Robotic' : 'Human'} crew · {m.risk} · concept
                      </span>
                    </div>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <p className="mission-footnote">
        <Orbit size={16} /> These are playful, scientifically informed mission concepts. Launches
        and rewards are simulated.
      </p>
    </div>
  );
}
function LockIcon() {
  return <ShieldCheck size={13} />;
}
export function MissionBuilder({
  target,
  game,
  onBack,
  onGenerate,
}: {
  target: ObjectId;
  game: GameState;
  onBack: () => void;
  onGenerate: (mission: Mission) => void;
}) {
  const [choices, setChoices] = useState<MissionChoices>({
    crew: 'robotic',
    goal: 'science',
    risk: 'careful',
  });
  const object = objectById(target);
  const sets = [
    {
      key: 'crew' as const,
      label: 'Who’s coming along?',
      number: '01',
      options: [
        { id: 'robotic', title: 'Robotic', detail: 'Brave little machines', icon: Bot },
        { id: 'human', title: 'Human', detail: 'A very long road trip', icon: UserRound },
      ],
    },
    {
      key: 'goal' as const,
      label: 'What’s the big idea?',
      number: '02',
      options: [
        { id: 'science', title: 'Science', detail: 'Ask a big question', icon: FlaskConical },
        { id: 'explore', title: 'Explore', detail: 'Go a little further', icon: Flag },
        { id: 'build', title: 'Build', detail: 'Make a home for ideas', icon: Hammer },
      ],
    },
    {
      key: 'risk' as const,
      label: 'How brave are we feeling?',
      number: '03',
      options: [
        { id: 'careful', title: 'Careful', detail: 'Check. Check again.', icon: ShieldCheck },
        { id: 'bold', title: 'Bold', detail: 'A calculated leap', icon: Zap },
        { id: 'unhinged', title: 'Unhinged', detail: 'Mochi has concerns', icon: Sparkles },
      ],
    },
  ];
  return (
    <div className="builder-screen">
      <BackButton onClick={onBack} label="Back to missions" />
      <div className="builder-heading">
        <div className="screen-intro left">
          <div className="eyebrow">
            <Rocket size={15} /> MOCHI’S MISSION WORKSHOP
          </div>
          <h1>
            A tiny plan.
            <br />
            <em>A giant leap.</em>
          </h1>
          <p>Three choices. One very big adventure.</p>
        </div>
        <div className="builder-destination">
          <Planet id={target} />
          <span className="eyebrow">DESTINATION</span>
          <strong>{object.name}</strong>
        </div>
      </div>
      <div className="builder-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onGenerate(buildMission(target, choices, game.missions.length));
          }}
          className="builder-form"
        >
          {sets.map((set) => (
            <fieldset key={set.key}>
              <legend>
                <span>{set.number}</span>
                {set.label}
              </legend>
              <div className={`option-grid ${set.key === 'crew' ? 'two' : ''}`}>
                {set.options.map((option) => {
                  const Icon = option.icon;
                  const selected = choices[set.key] === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`mission-option ${selected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={set.key}
                        value={option.id}
                        checked={selected}
                        onChange={() => setChoices((old) => ({ ...old, [set.key]: option.id }))}
                      />
                      <span className="option-check">{selected && <Check size={12} />}</span>
                      <Icon size={24} />
                      <strong>{option.title}</strong>
                      <small>{option.detail}</small>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <Button type="submit" className="button-cream">
            <Rocket size={18} /> Create flight plan <ArrowRight size={18} />
          </Button>
        </form>
        <aside className="mission-coach">
          <Mochi
            mood={
              choices.risk === 'unhinged' ? 'scared' : choices.crew === 'human' ? 'excited' : 'idle'
            }
          />
          <div className="coach-bubble">
            <p>
              {choices.risk === 'unhinged'
                ? '“I packed extra snacks. And an extra parachute. Just in case.”'
                : choices.crew === 'human'
                  ? '“Room for one very small space explorer?”'
                  : '“Robots don’t need snacks. More for me!”'}
            </p>
            <span>— MOCHI, YOUR MISSION SPECIALIST</span>
          </div>
          <div className="workshop-note">
            <Heart size={15} />
            <p>
              Big imagination.
              <br />
              Real science underneath.
              <br />
              <span>Mission times are illustrative, not computed trajectories.</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
export function MissionResult({
  mission,
  launched,
  onLaunch,
  onBack,
  onNext,
}: {
  mission: Mission;
  launched: boolean;
  onLaunch: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copy() {
    const text = `${mission.name}\n${mission.subtitle}\n${mission.objective}\n${mission.explanation}\nCELESTIAL · Simulated educational mission concept`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <div className="mission-result-screen narrow-screen">
      <BackButton onClick={onBack} label="Back to missions" />
      <div className="screen-intro">
        <div className="eyebrow">
          {launched ? 'A LITTLE DREAM, SET IN MOTION' : 'YOUR IMAGINATION, FLIGHT-READY'}
        </div>
        <h1>
          {launched ? (
            <>
              And <em>we’re off!</em>
            </>
          ) : (
            <>
              Made of <em>possibility.</em>
            </>
          )}
        </h1>
        <p>
          {launched
            ? 'Your mission is safely tucked into your flight journal.'
            : 'One small plan for you. One giant adventure for Mochi.'}
        </p>
      </div>
      <motion.article
        className={`mission-ticket paper ${launched ? 'launched' : ''}`}
        animate={launched ? { y: [0, -6, 0] } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="ticket-header">
          <span className="eyebrow">
            <Rocket size={15} /> CELESTIAL FLIGHT PROGRAM
          </span>
          <Tag>{launched ? 'LAUNCHED · SIMULATION' : 'READY FOR LAUNCH'}</Tag>
        </div>
        <div className="ticket-title">
          <div>
            <span className="eyebrow">{mission.name}</span>
            <h2>{mission.subtitle}</h2>
          </div>
          <Planet id={mission.target} />
        </div>
        <div className="ticket-choices">
          <span>
            {mission.crew === 'robotic' ? <Bot size={14} /> : <UserRound size={14} />}{' '}
            {mission.crew}
          </span>
          <span>
            <FlaskConical size={14} />
            {mission.goal}
          </span>
          <span>
            <Zap size={14} />
            {mission.risk}
          </span>
        </div>
        <div className="ticket-objective">
          <span className="eyebrow">THE BIG IDEA</span>
          <p>{mission.objective}</p>
        </div>
        <div className="ticket-stats">
          <div>
            <span className="eyebrow">DURATION</span>
            <strong>{mission.duration}</strong>
          </div>
          <div>
            <span className="eyebrow">DANGER</span>
            <div
              className="danger-bars"
              role="img"
              aria-label={`${mission.danger} out of 5 danger`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={n <= mission.danger ? 'filled' : ''} />
              ))}
            </div>
          </div>
        </div>
        <div className="ticket-threat">
          <ShieldCheck size={16} />
          <span>
            Keep an eye on: <strong>{mission.threat}</strong>
          </span>
        </div>
        <div className="science-note">
          <FlaskConical size={20} />
          <div>
            <span className="eyebrow">A LITTLE REAL SCIENCE</span>
            <p>{mission.explanation}</p>
          </div>
        </div>
        <div className="ticket-tear" />
        <div className="ticket-reward">
          <span>
            <Star size={17} fill="currentColor" /> +{mission.xp} MISSION XP
          </span>
          <span>
            {launched ? (
              <>
                <Check size={14} /> ADDED TO YOUR JOURNAL
              </>
            ) : (
              'ONE REWARD PER DESTINATION'
            )}
          </span>
        </div>
      </motion.article>
      <div className="mission-result-actions">
        {launched ? (
          <Button className="button-cream" onClick={onNext}>
            <Compass size={18} /> Hunt your next wonder <ArrowRight size={18} />
          </Button>
        ) : (
          <Button className="button-cream" onClick={onLaunch}>
            <Rocket size={18} /> Launch this little dream <ArrowRight size={18} />
          </Button>
        )}
        <button className="text-link" onClick={() => void copy()}>
          {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
          {copied ? 'Flight plan copied' : 'Copy flight plan'}
        </button>
        {copyError && (
          <p className="inline-alert" role="status">
            Clipboard unavailable. You can select and copy the flight plan above.
          </p>
        )}
        <p className="quiet-caption">Imagination-powered. No actual spacecraft were launched.</p>
      </div>
    </div>
  );
}
