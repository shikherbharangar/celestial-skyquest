import { objectById } from '../data/astronomy';
import type { Mission, MissionChoices, ObjectId } from '../types';

// These templates explain a plausible mission idea. They don’t calculate a flight path.
export function buildMission(target: ObjectId, choices: MissionChoices, count: number): Mission {
  const object = objectById(target);
  const isGasPlanet = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(target);
  const isDistantTarget = ['star', 'deep-sky', 'constellation'].includes(object.kind);
  const missionLocation = isDistantTarget
    ? 'Earth orbit'
    : target === 'earth'
      ? 'low Earth orbit'
      : `orbit around ${object.name}`;
  const objective =
    choices.goal === 'science'
      ? `Send ${choices.crew === 'robotic' ? 'a robotic observatory' : 'a crew-tended observatory'} to ${missionLocation} to ${isDistantTarget ? `study the light from ${object.name}` : `map ${object.name} and study its ${isGasPlanet ? 'clouds and magnetic field' : 'surface from above'}`}.`
      : choices.goal === 'explore'
        ? `Scout ${isDistantTarget ? object.name + ' with a telescope in Earth orbit' : 'the surroundings of ' + object.name + ' from orbit'}, building a map for the next generation of explorers.`
        : `Assemble ${choices.crew === 'robotic' ? 'an autonomous research relay' : 'a crew-supported research station'} in ${missionLocation}${isDistantTarget ? ` to observe ${object.name}` : ''}.`;
  const crewNote =
    choices.crew === 'human' && isGasPlanet
      ? ' Sending people this far is still speculative. We’d need radiation shielding, reliable life support, and a robotic mission to scout ahead.'
      : choices.crew === 'human' && ['venus', 'mercury'].includes(target)
        ? ' The crew would stay in orbit. The surface heat makes a landing far too dangerous.'
        : '';
  const explanation = isDistantTarget
    ? `${object.name} is ${object.distance.toLowerCase()} away${target === 'orion' ? ' across its separate stars' : ''}. We’ll study it with a telescope in Earth orbit. Flying there is beyond this mission.`
    : isGasPlanet
      ? `${object.name} has no solid surface to land on. This mission stays in orbit${target === 'jupiter' ? ', where Jupiter’s intense radiation still demands careful shielding' : ''}.${crewNote}`
      : `${object.name} has ${object.gravity} surface gravity. Mapping it from orbit gives us a closer look without having to land.${crewNote}`;
  return {
    ...choices,
    target,
    id: crypto.randomUUID(),
    name: `MISSION ${choices.risk === 'unhinged' ? 'COMET' : choices.goal === 'build' ? 'NEST' : 'AURORA'}-${String(count + 1).padStart(2, '0')}`,
    subtitle: `${object.name} ${choices.goal === 'science' ? 'Science Scout' : choices.goal === 'explore' ? 'Pathfinder' : 'Research Outpost'}`,
    objective,
    duration:
      isDistantTarget || target === 'earth'
        ? '2 years · concept'
        : target === 'moon'
          ? '30 days · concept'
          : isGasPlanet
            ? '6–12 years · concept'
            : '2–5 years · concept',
    danger: Math.min(
      5,
      (isGasPlanet ? 3 : 1) +
        (choices.crew === 'human' ? 1 : 0) +
        (choices.risk === 'bold' ? 1 : choices.risk === 'unhinged' ? 2 : 0),
    ),
    threat: isGasPlanet
      ? 'Radiation & long travel times'
      : isDistantTarget || target === 'earth'
        ? 'Orbital debris & instrument failure'
        : target === 'venus' || target === 'mercury'
          ? 'Extreme heat'
          : 'Radiation & communication delays',
    explanation,
    xp: 700,
    createdAt: new Date().toISOString(),
  };
}
