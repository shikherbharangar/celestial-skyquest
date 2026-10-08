import { describe, expect, it } from 'vitest';
import {
  achievements,
  discover,
  hasThreeNightStreak,
  initialState,
  isGameState,
  launchMission,
  nextTarget,
  rankFor,
} from '../../src/game/progression';
import { buildMission } from '../../src/game/missions';
import { OBJECTS, PLANETS } from '../../src/data/astronomy';

describe('exploration and persistence invariants', () => {
  it('starts with Earth as home, no fake discoveries or XP', () => {
    const state = initialState();
    expect(state.xp).toBe(0);
    expect(state.discoveries.map((d) => [d.id, d.source])).toEqual([['earth', 'home']]);
    expect(nextTarget(state)).toBe('jupiter');
    expect(achievements(state).some((a) => a.earned)).toBe(false);
  });
  it('awards a new discovery exactly once, including across reload', () => {
    const first = discover(initialState(), 'jupiter', new Date('2026-10-08T12:00:00Z'));
    const restored = JSON.parse(JSON.stringify(first));
    expect(isGameState(restored)).toBe(true);
    const second = discover(restored, 'jupiter', new Date('2026-10-09T12:00:00Z'));
    expect(second.xp).toBe(250);
    expect(second.discoveries).toHaveLength(2);
    expect(second.observationDays).toHaveLength(2);
    expect(nextTarget(second)).toBe('moon');
    expect(achievements(second).find((a) => a.id === 'first')?.earned).toBe(true);
  });
  it('only grants mission XP after discovering the target and once per destination', () => {
    const mission = buildMission(
      'jupiter',
      { crew: 'robotic', goal: 'science', risk: 'careful' },
      0,
    );
    const blank = initialState();
    expect(launchMission(blank, mission)).toBe(blank);
    const discovered = discover(blank, 'jupiter');
    const launched = launchMission(discovered, mission);
    expect(launched.xp).toBe(950);
    expect(launched.missions).toHaveLength(1);
    const reroll = buildMission('jupiter', { crew: 'human', goal: 'build', risk: 'unhinged' }, 1);
    expect(launchMission(launched, reroll)).toBe(launched);
    expect(achievements(launched).find((a) => a.id === 'mission')?.earned).toBe(true);
  });
  it.each([
    [0, 1, 'Skywatcher'],
    [249, 1, 'Skywatcher'],
    [250, 2, 'Stargazer'],
    [750, 3, 'Explorer'],
    [1500, 4, 'Astronomer'],
    [3000, 5, 'Mission Specialist'],
    [5000, 6, 'Commander'],
  ])('maps %i XP to the right rank', (xp, level, name) => {
    expect(rankFor(Number(xp))).toMatchObject({ level, name });
  });
  it('recognizes consecutive calendar dates across year boundaries without counting duplicates', () => {
    expect(hasThreeNightStreak(['2026-12-31', '2027-01-01', '2027-01-02'])).toBe(true);
    expect(hasThreeNightStreak(['2026-10-08', '2026-10-08', '2026-10-10'])).toBe(false);
    expect(hasThreeNightStreak(['2026-10-08', '2026-10-10', '2026-10-11'])).toBe(false);
  });
  it('unlocks planet and deep-sky achievements only for relevant discoveries', () => {
    let state = initialState();
    for (const id of ['jupiter', 'saturn', 'mars', 'andromeda'] as const)
      state = discover(state, id);
    expect(
      achievements(state)
        .filter((a) => a.earned)
        .map((a) => a.id),
    ).toEqual(['first', 'planets', 'deep']);
  });
  it('rejects corrupt and incompatible saves before they reach the UI', () => {
    expect(isGameState(null)).toBe(false);
    expect(isGameState({ ...initialState(), version: 2 })).toBe(false);
    expect(isGameState({ ...initialState(), discoveries: [{ id: 'pluto', date: 'bad' }] })).toBe(
      false,
    );
    expect(isGameState({ ...initialState(), xp: -100 })).toBe(false);
    expect(isGameState({ ...initialState(), missions: [{ target: 'jupiter' }] })).toBe(false);
    expect(isGameState({ ...initialState(), observationDays: [null] })).toBe(false);
  });
});

describe('science constraints for all mission choices', () => {
  for (const target of ['jupiter', 'saturn', 'uranus', 'neptune'] as const)
    it(`${target} missions never attempt surface landings`, () => {
      for (const crew of ['robotic', 'human'] as const)
        for (const goal of ['science', 'explore', 'build'] as const)
          for (const risk of ['careful', 'bold', 'unhinged'] as const) {
            const mission = buildMission(target, { crew, goal, risk }, 0);
            expect(mission.objective).toMatch(/orbit/);
            expect(mission.explanation).toContain('no solid surface');
            expect(mission.danger).toBeLessThanOrEqual(5);
            if (crew === 'human') expect(mission.explanation).toContain('speculative');
          }
    });
  it('keeps distant-target missions in Earth orbit and labels illustrative times', () => {
    for (const target of ['sirius', 'orion', 'andromeda', 'pleiades'] as const) {
      const mission = buildMission(target, { crew: 'human', goal: 'build', risk: 'bold' }, 2);
      expect(mission.objective).toContain('Earth orbit');
      expect(mission.duration).toContain('concept');
      expect(mission.explanation).toContain('Flying there is beyond this mission');
    }
  });
  it('keeps reference data complete and solar distances explicitly labelled', () => {
    expect(PLANETS).toHaveLength(8);
    expect(new Set(OBJECTS.map((o) => o.id)).size).toBe(OBJECTS.length);
    for (const object of PLANETS) expect(object.distance).toContain('Sun');
  });
});
