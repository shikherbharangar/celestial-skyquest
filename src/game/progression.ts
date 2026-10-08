import { HUNT_ORDER, objectById, OBJECTS } from '../data/astronomy';
import type { GameState, Mission, ObjectId } from '../types';

export const RANKS = [
  { name: 'Skywatcher', xp: 0 },
  { name: 'Stargazer', xp: 250 },
  { name: 'Explorer', xp: 750 },
  { name: 'Astronomer', xp: 1500 },
  { name: 'Mission Specialist', xp: 3000 },
  { name: 'Commander', xp: 5000 },
];
export const initialState = (): GameState => ({
  version: 1,
  xp: 0,
  discoveries: [{ id: 'earth', date: new Date().toISOString(), source: 'home' }],
  missions: [],
  observationDays: [],
  sound: false,
});
export function rankFor(xp: number) {
  const level = RANKS.findLastIndex((rank) => xp >= rank.xp);
  const rank = RANKS[Math.max(level, 0)];
  const next = RANKS[level + 1];
  return {
    ...rank,
    level: level + 1,
    next,
    progress: next ? Math.min(100, ((xp - rank.xp) / (next.xp - rank.xp)) * 100) : 100,
  };
}
export function localDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function discover(
  state: GameState,
  id: ObjectId,
  now = new Date(),
  source: 'demo' | 'gemma' = 'demo',
): GameState {
  const exists = state.discoveries.some((item) => item.id === id);
  const day = localDay(now);
  return {
    ...state,
    xp: state.xp + (exists ? 0 : objectById(id).xp),
    discoveries: exists
      ? state.discoveries.map((item) =>
          item.id === id && item.source === 'demo' && source === 'gemma'
            ? { ...item, source, date: now.toISOString() }
            : item,
        )
      : [...state.discoveries, { id, date: now.toISOString(), source }],
    observationDays: state.observationDays.includes(day)
      ? state.observationDays
      : [...state.observationDays, day],
  };
}
export function launchMission(state: GameState, mission: Mission): GameState {
  if (
    state.missions.some((item) => item.target === mission.target) ||
    !state.discoveries.some((item) => item.id === mission.target)
  )
    return state;
  return { ...state, xp: state.xp + mission.xp, missions: [...state.missions, mission] };
}
export function nextTarget(state: GameState): ObjectId {
  return HUNT_ORDER.find((id) => !state.discoveries.some((item) => item.id === id)) ?? 'jupiter';
}
export function hasThreeNightStreak(days: string[]): boolean {
  const unique = new Set(days);
  return days.some((day) => {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() - 1);
    if (!unique.has(localDay(date))) return false;
    date.setDate(date.getDate() - 1);
    return unique.has(localDay(date));
  });
}
export function achievements(state: GameState) {
  const found = state.discoveries.filter((item) => item.source !== 'home');
  return [
    {
      id: 'first',
      name: 'First Light',
      description: 'Make your first sky discovery',
      earned: found.length > 0,
      icon: 'moon',
    },
    {
      id: 'planets',
      name: 'Planet Hunter',
      description: 'Discover three planets beyond Earth',
      earned: found.filter((d) => objectById(d.id).kind === 'planet').length >= 3,
      icon: 'orbit',
    },
    {
      id: 'deep',
      name: 'Deep Sky Rookie',
      description: 'Discover a cluster or galaxy',
      earned: found.some((d) => objectById(d.id).kind === 'deep-sky'),
      icon: 'stars',
    },
    {
      id: 'streak',
      name: 'Three Night Streak',
      description: 'Explore on three consecutive dates',
      earned: hasThreeNightStreak(state.observationDays),
      icon: 'flame',
    },
    {
      id: 'mission',
      name: 'Mission Architect',
      description: 'Launch your first mission concept',
      earned: state.missions.length > 0,
      icon: 'rocket',
    },
    {
      id: 'eye',
      name: 'Naked Eye Legend',
      description: 'Collect Moon, Venus, Mars, Jupiter and Sirius',
      earned: ['moon', 'venus', 'mars', 'jupiter', 'sirius'].every((id) =>
        found.some((d) => d.id === id),
      ),
      icon: 'eye',
    },
  ];
}
export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;
  const ids = new Set(OBJECTS.map((o) => o.id));
  return (
    s.version === 1 &&
    Number.isFinite(s.xp) &&
    s.xp >= 0 &&
    typeof s.sound === 'boolean' &&
    Array.isArray(s.discoveries) &&
    s.discoveries.every(
      (d) =>
        d &&
        ids.has(d.id) &&
        ['demo', 'gemma', 'home'].includes(d.source) &&
        !Number.isNaN(Date.parse(d.date)),
    ) &&
    new Set(s.discoveries.map((d) => d.id)).size === s.discoveries.length &&
    Array.isArray(s.missions) &&
    s.missions.every(
      (m) =>
        m &&
        ids.has(m.target) &&
        typeof m.id === 'string' &&
        typeof m.name === 'string' &&
        typeof m.objective === 'string' &&
        typeof m.subtitle === 'string' &&
        typeof m.duration === 'string' &&
        typeof m.threat === 'string' &&
        typeof m.explanation === 'string' &&
        Number.isFinite(m.danger) &&
        Number.isFinite(m.xp) &&
        m.xp >= 0 &&
        ['robotic', 'human'].includes(m.crew) &&
        ['science', 'explore', 'build'].includes(m.goal) &&
        ['careful', 'bold', 'unhinged'].includes(m.risk) &&
        !Number.isNaN(Date.parse(m.createdAt)),
    ) &&
    Array.isArray(s.observationDays) &&
    s.observationDays.every((day) => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day))
  );
}
