import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Download,
  Info,
  Menu,
  Rocket,
  Star,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react';
import { Tonight } from './screens/Tonight';
import { Expedition } from './screens/Expedition';
import { DiscoveryScreen } from './screens/Discovery';
import { Collection } from './screens/Collection';
import { Missions, MissionBuilder, MissionResult } from './screens/Missions';
import { Button, Modal } from './components/ui';
import { SkyGuide } from './components/SkyGuide';
import { Mochi, Sparkle } from './components/Art';
import { useGame } from './hooks/useGame';
import { usePwa } from './hooks/usePwa';
import {
  achievements,
  discover,
  initialState,
  launchMission,
  nextTarget,
  rankFor,
} from './game/progression';
import { playSound, setSoundEnabled } from './services/audio';
import type { Identification, Mission, ObjectId, ObservationContext, Screen } from './types';

export default function App() {
  const { game, setGame, storageWarning } = useGame();
  const [screen, setScreen] = useState<Screen>('tonight');
  const [target, setTarget] = useState<ObjectId>(() => nextTarget(game));
  const [reveal, setReveal] = useState({
    photo: '/sample-sky.svg',
    isNew: true,
    provider: 'demo' as Identification['provider'],
  });
  const [mission, setMission] = useState<Mission | null>(null);
  const [dialog, setDialog] = useState<'guide' | 'about' | 'rank' | null>(null);
  const [context, setContext] = useState<ObservationContext>({ time: new Date() });
  const [toast, setToast] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const { installed, install, help } = usePwa();
  const rank = rankFor(game.xp);
  const mainScreen = ['tonight', 'collection', 'missions'].includes(screen);
  const section = ['builder', 'mission-result'].includes(screen)
    ? 'missions'
    : ['expedition', 'discovery'].includes(screen)
      ? 'tonight'
      : screen;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = `CELESTIAL · ${screen === 'tonight' ? 'Little explorer, big universe' : screen === 'collection' ? 'Your field journal' : screen === 'expedition' ? 'Eyes up, explorer' : screen === 'discovery' ? 'A little wonder, found' : 'Dream up a mission'}`;
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [screen]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const handler = () => setOffline(!navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);
  function navigate(next: Screen) {
    setScreen(next);
    setMobileMenu(false);
  }
  function startHunt(id = nextTarget(game)) {
    setTarget(id);
    navigate('expedition');
  }
  function openMission(id: ObjectId) {
    const existing = game.missions.find((item) => item.target === id);
    setTarget(id);
    if (existing) {
      setMission(existing);
      navigate('mission-result');
    } else navigate('builder');
  }
  function onDiscovery(result: Identification, photo: string) {
    if (!result.object) return;
    const id = result.object;
    const isNew = !game.discoveries.some((d) => d.id === id);
    setReveal({ photo, isNew, provider: result.provider });
    setTarget(id);
    setGame((old) => discover(old, id, new Date(), result.provider));
    navigate('discovery');
  }
  function toggleSound() {
    const sound = !game.sound;
    setSoundEnabled(sound);
    setGame((old) => ({ ...old, sound }));
    if (sound) playSound('tap');
  }
  function launch() {
    if (!mission) return;
    setGame((old) => launchMission(old, mission));
    playSound('launch');
    setToast('Mission launched! Your plan earned +700 XP.');
  }
  function exportJournal() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'celestial-field-journal.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Your field journal is ready to keep.');
  }
  const navigation = [
    { screen: 'tonight' as Screen, label: 'Tonight', icon: Compass },
    { screen: 'collection' as Screen, label: 'Field journal', icon: BookOpen },
    { screen: 'missions' as Screen, label: 'Missions', icon: Rocket },
  ];
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app-shell ${!mainScreen ? 'focused-mode' : ''}`}>
        <div className="sky-grain" aria-hidden="true" />
        <div className="ambient-stars" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <a className="skip-link" href="#main">
          Skip to adventure
        </a>
        <header className="app-header">
          <button className="brand" onClick={() => navigate('tonight')} aria-label="Celestial home">
            <span className="brand-symbol">
              <Sparkle />
              <span />
            </span>
            <span>
              CELESTIAL<small>A LITTLE CLOSER TO THE COSMOS</small>
            </span>
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                key={item.screen}
                className={section === item.screen ? 'active' : ''}
                aria-current={section === item.screen ? 'page' : undefined}
                onClick={() => navigate(item.screen)}
              >
                {item.label}
                <span />
              </button>
            ))}
          </nav>
          <div className="header-controls">
            <button
              className="rank-chip"
              onClick={() => setDialog('rank')}
              aria-label={`Level ${rank.level} ${rank.name}, ${game.xp} XP. View progression`}
            >
              <span className="rank-star">
                <Star size={15} fill="currentColor" />
              </span>
              <span>
                <strong>LV. {rank.level}</strong>
                <span>{game.xp.toLocaleString()} XP</span>
              </span>
              <div className="rank-mini-bar">
                <span style={{ width: `${Math.max(6, rank.progress)}%` }} />
              </div>
            </button>
            <button
              className="icon-button sound-toggle"
              onClick={toggleSound}
              aria-label={game.sound ? 'Mute sound effects' : 'Enable sound effects'}
              aria-pressed={game.sound}
            >
              {game.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <button
              className="mobile-menu-toggle icon-button"
              aria-label="Open explorer menu"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>
        {mobileMenu && (
          <div className="mobile-menu">
            <button
              onClick={() => {
                setDialog('guide');
                setMobileMenu(false);
              }}
            >
              Local sky guide <Compass size={16} />
            </button>
            <button
              onClick={() => {
                setDialog('about');
                setMobileMenu(false);
              }}
            >
              About & settings <Info size={16} />
            </button>
            <button onClick={toggleSound}>
              {game.sound ? 'Mute sound' : 'Enable sound'}
              {game.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        )}
        <div className="meta-bar">
          <span>
            <span className="status-dot" />
            {offline ? (
              <>
                <WifiOff size={12} /> OFFLINE ADVENTURE
              </>
            ) : (
              'THE UNIVERSE IS OPEN'
            )}
          </span>
          <button onClick={() => setDialog('about')}>
            A COZY STARGAZING GAME <span>·</span> <strong>EXPLORER EDITION</strong>
            <Info size={12} />
          </button>
        </div>
        {storageWarning && (
          <p className="storage-warning" role="status">
            {storageWarning}
          </p>
        )}
        <main id="main" className="main-content">
          {screen === 'tonight' && (
            <Tonight
              game={game}
              target={nextTarget(game)}
              onBegin={() => startHunt()}
              onCollection={() => navigate('collection')}
              onMissions={() => navigate('missions')}
              onGuide={() => setDialog('guide')}
            />
          )}
          {screen === 'expedition' && (
            <Expedition
              target={target}
              onTarget={setTarget}
              onBack={() => navigate('tonight')}
              onDiscover={onDiscovery}
              onGuide={() => setDialog('guide')}
              context={{ ...context, time: new Date() }}
            />
          )}
          {screen === 'discovery' && (
            <DiscoveryScreen
              target={target}
              photo={reveal.photo}
              isNew={reveal.isNew}
              provider={reveal.provider}
              onMission={() => openMission(target)}
              onCollection={() => navigate('collection')}
              onNext={() => startHunt()}
            />
          )}
          {screen === 'collection' && (
            <Collection game={game} onHunt={startHunt} onMission={openMission} />
          )}
          {screen === 'missions' && (
            <Missions
              game={game}
              onBuild={openMission}
              onHunt={() => startHunt()}
              onOpen={(item) => {
                setMission(item);
                navigate('mission-result');
              }}
            />
          )}
          {screen === 'builder' && (
            <MissionBuilder
              key={target}
              target={target}
              game={game}
              onBack={() => navigate('missions')}
              onGenerate={(item) => {
                setMission(item);
                navigate('mission-result');
              }}
            />
          )}
          {screen === 'mission-result' && mission && (
            <MissionResult
              key={mission.id}
              mission={mission}
              launched={game.missions.some((m) => m.target === mission.target)}
              onLaunch={launch}
              onBack={() => navigate('missions')}
              onNext={() => startHunt()}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>
            <Sparkle /> A little less scrolling. A little more stargazing.
          </span>
          <div>
            <button onClick={() => setDialog('guide')}>
              Explorer’s guide <ArrowUpRight size={13} />
            </button>
            <button onClick={() => setDialog('about')}>
              Made for wonder <Star size={12} />
            </button>
          </div>
        </footer>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <button
              key={item.screen}
              className={section === item.screen ? 'active' : ''}
              aria-current={section === item.screen ? 'page' : undefined}
              onClick={() => navigate(item.screen)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {dialog === 'guide' && (
          <SkyGuide
            onClose={() => setDialog(null)}
            context={context}
            onContext={setContext}
            onChoose={startHunt}
          />
        )}
        {dialog === 'rank' && (
          <Modal title="Small steps. Starry horizons." onClose={() => setDialog(null)}>
            <div className="rank-modal-hero">
              <Mochi mood="excited" />
              <div>
                <span className="eyebrow">LEVEL {rank.level}</span>
                <h3>{rank.name}</h3>
                <strong>{game.xp.toLocaleString()} XP</strong>
              </div>
            </div>
            <div className="thin-progress">
              <span style={{ width: `${rank.progress}%` }} />
            </div>
            <p className="modal-description">
              {rank.next
                ? `${rank.next.xp - game.xp} XP until ${rank.next.name}. New discoveries earn 100–500 XP; your first mission to each destination earns 700 XP.`
                : 'Commander! Keep exploring for the simple joy of a new perspective.'}
            </p>
            <div className="rank-list">
              {[
                'Skywatcher',
                'Stargazer',
                'Explorer',
                'Astronomer',
                'Mission Specialist',
                'Commander',
              ].map((name, i) => (
                <div key={name} className={i < rank.level ? 'reached' : ''}>
                  <span>{i + 1}</span>
                  {name}
                  {i < rank.level && <Check size={15} />}
                </div>
              ))}
            </div>
            <p className="quiet-caption">
              {achievements(game).filter((a) => a.earned).length} explorer badges earned · Practice
              progress stays on this device.
            </p>
          </Modal>
        )}
        {dialog === 'about' && (
          <Modal
            title="Made for a little wonder."
            onClose={() => {
              setDialog(null);
              setResetConfirm(false);
            }}
            className="about-modal"
          >
            <div className="about-brand">
              <Mochi mood="idle" />
              <p>
                Look up, find something new, and bring it back to your journal. Mochi will help you
                learn about it and plan a mission.
              </p>
            </div>
            <div className="about-demo">
              <span className="eyebrow">BEFORE YOU HEAD OUT</span>
              <p>
                Practice mode lets you try the game without sending any photos. Choose Live Gemma to
                have Google AI Studio look at a resized copy, along with the current time and your
                approximate location if you shared it. AI can get things wrong, so treat a match as
                a suggestion.
              </p>
              <p>
                The sky guide calculates where the planets are right now. Missions are imaginary
                trips built around real space facts. Practice works offline once the app is saved;
                Live Gemma needs an internet connection and a working server key.
              </p>
            </div>
            <div className="settings-list">
              <button onClick={toggleSound}>
                <span>
                  {game.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Gentle sound effects
                </span>
                <strong>{game.sound ? 'ON' : 'OFF'}</strong>
              </button>
              <button onClick={() => void install()} disabled={installed}>
                <span>
                  <Download size={18} />
                  {installed
                    ? 'Installed for your next adventure'
                    : 'Add CELESTIAL to your home screen'}
                </span>
                <ArrowUpRight size={16} />
              </button>
              {help && (
                <p className="install-help">
                  In a supported browser, open its menu and choose “Install app” or “Add to Home
                  Screen.” On iPhone, use Safari’s Share menu → Add to Home Screen. Offline play is
                  available after the production app’s first online load.
                </p>
              )}
              <button onClick={exportJournal}>
                <span>
                  <BookOpen size={18} /> Export your field journal
                </span>
                <Download size={16} />
              </button>
              <button onClick={() => setDialog('guide')}>
                <span>
                  <Compass size={18} /> Sky tips & science sources
                </span>
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="reset-section">
              {resetConfirm ? (
                <>
                  <p>
                    Start fresh? This removes this device’s discoveries, XP, and flight plans.
                    Export your journal first if you’d like to keep a copy.
                  </p>
                  <div>
                    <Button
                      className="button-danger"
                      onClick={() => {
                        setGame(initialState());
                        setTarget('jupiter');
                        navigate('tonight');
                        setDialog(null);
                        setResetConfirm(false);
                        setToast('A fresh page. A whole universe ahead.');
                      }}
                    >
                      Start a fresh journal
                    </Button>
                    <button className="text-link" onClick={() => setResetConfirm(false)}>
                      Keep my journal
                    </button>
                  </div>
                </>
              ) : (
                <button className="text-link" onClick={() => setResetConfirm(true)}>
                  Start a fresh journal
                </button>
              )}
            </div>
            <p className="quiet-caption">
              Original artwork & character · No account, trackers, or ads.
              <br />
              Best enjoyed with a safe place to stand and a little curiosity.
            </p>
          </Modal>
        )}
        {toast && (
          <div className="toast" role="status">
            <Sparkle />
            {toast}
            <button aria-label="Dismiss notification" onClick={() => setToast('')}>
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
