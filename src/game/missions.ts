import { objectById } from '../data/astronomy';
import type { Mission, MissionChoices, ObjectId } from '../types';

// These are educational mission concepts, not trajectory simulations.
// Science facts stay in structured data; a future narrative provider can decorate them.
export function buildMission(target: ObjectId, choices: MissionChoices, count: number): Mission {
  const object = objectById(target);
  const gasWorld = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(target);
  const distant = ['star', 'deep-sky', 'constellation'].includes(object.kind);
  const location = distant
    ? 'Earth orbit'
    : target === 'earth'
      ? 'low Earth orbit'
      : `orbit around ${object.name}`;
  const objective =
    choices.goal === 'science'
      ? `Send ${choices.crew === 'robotic' ? 'a robotic observatory' : 'a crew-tended observatory'} to ${location} to ${distant ? `study the light from ${object.name}` : `map ${object.name} and study its ${gasWorld ? 'clouds and magnetic field' : 'surface from above'}`}.`
      : choices.goal === 'explore'
        ? `Scout ${distant ? object.name + ' with a telescope in Earth orbit' : 'the surroundings of ' + object.name + ' from orbit'}, building a map for the next generation of explorers.`
        : `Assemble ${choices.crew === 'robotic' ? 'an autonomous research relay' : 'a crew-supported research station'} in ${location}${distant ? ` to observe ${object.name}` : ''}.`;
  const extra =
    choices.crew === 'human' && gasWorld
      ? ' A crewed outer-planet expedition is speculative; radiation shielding, life support, and an uncrewed precursor would be essential.'
      : choices.crew === 'human' && ['venus', 'mercury'].includes(target)
        ? ' Human operations would remain orbital; extreme heat makes surface operations especially hazardous.'
        : '';
  const explanation = distant
    ? `${object.name} is ${object.distance.toLowerCase()} away${target === 'orion' ? ' across its separate stars' : ''}. This concept studies it from Earth orbit; it does not attempt interstellar travel.`
    : gasWorld
      ? `${object.name} has no solid surface to land on. This mission stays in orbit${target === 'jupiter' ? ', where Jupiter’s intense radiation still demands careful shielding' : ''}.${extra}`
      : `${object.name} has ${object.gravity} surface gravity. Orbital mapping lets us investigate without the added complexity of a landing.${extra}`;
  return {
    ...choices,
    target,
    id: crypto.randomUUID(),
    name: `MISSION ${choices.risk === 'unhinged' ? 'COMET' : choices.goal === 'build' ? 'NEST' : 'AURORA'}-${String(count + 1).padStart(2, '0')}`,
    subtitle: `${object.name} ${choices.goal === 'science' ? 'Science Scout' : choices.goal === 'explore' ? 'Pathfinder' : 'Research Outpost'}`,
    objective,
    duration:
      distant || target === 'earth'
        ? '2 years · concept'
        : target === 'moon'
          ? '30 days · concept'
          : gasWorld
            ? '6–12 years · concept'
            : '2–5 years · concept',
    danger: Math.min(
      5,
      (gasWorld ? 3 : 1) +
        (choices.crew === 'human' ? 1 : 0) +
        (choices.risk === 'bold' ? 1 : choices.risk === 'unhinged' ? 2 : 0),
    ),
    threat: gasWorld
      ? 'Radiation & long travel times'
      : distant || target === 'earth'
        ? 'Orbital debris & instrument failure'
        : target === 'venus' || target === 'mercury'
          ? 'Extreme heat'
          : 'Radiation & communication delays',
    explanation,
    xp: 700,
    createdAt: new Date().toISOString(),
  };
}
