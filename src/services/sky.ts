import { Body, Equator, Horizon, Observer } from 'astronomy-engine';
import type { ObjectId, SkyCandidate } from '../types';

const bodies: [ObjectId, Body][] = [
  ['mercury', Body.Mercury],
  ['venus', Body.Venus],
  ['mars', Body.Mars],
  ['jupiter', Body.Jupiter],
  ['saturn', Body.Saturn],
  ['uranus', Body.Uranus],
  ['neptune', Body.Neptune],
  ['moon', Body.Moon],
];
export function visibleCandidates(
  latitude: number,
  longitude: number,
  time = new Date(),
): { candidates: SkyCandidate[]; daylight: boolean } {
  const observer = new Observer(latitude, longitude, 0);
  const position = (body: Body) => {
    const eq = Equator(body, time, observer, true, true);
    return Horizon(time, observer, eq.ra, eq.dec, 'normal');
  };
  const sun = position(Body.Sun);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const candidates = bodies
    .map(([id, body]) => {
      const horizon = position(body);
      return {
        id,
        altitude: Math.round(horizon.altitude),
        azimuth: Math.round(horizon.azimuth),
        direction: directions[Math.round(horizon.azimuth / 45) % 8],
      };
    })
    .filter((item) => item.altitude >= 10)
    .sort((a, b) => b.altitude - a.altitude);
  return { candidates, daylight: sun.altitude > -6 };
}
