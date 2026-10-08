export type ObjectId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'moon'
  | 'sirius'
  | 'orion'
  | 'pleiades'
  | 'andromeda';
export type Rarity = 'Familiar' | 'Uncommon' | 'Rare' | 'Legendary';
export interface SkyObject {
  id: ObjectId;
  name: string;
  kind: 'planet' | 'moon' | 'star' | 'constellation' | 'deep-sky';
  rarity: Rarity;
  xp: number;
  color: string;
  fact: string;
  hint: string;
  distance: string;
  diameter: string;
  gravity: string;
  difficulty: string;
}
export interface Discovery {
  id: ObjectId;
  date: string;
  source: 'demo' | 'gemma' | 'home';
}
export type Crew = 'robotic' | 'human';
export type Goal = 'science' | 'explore' | 'build';
export type Risk = 'careful' | 'bold' | 'unhinged';
export interface MissionChoices {
  crew: Crew;
  goal: Goal;
  risk: Risk;
}
export interface Mission extends MissionChoices {
  id: string;
  target: ObjectId;
  name: string;
  subtitle: string;
  objective: string;
  duration: string;
  danger: number;
  threat: string;
  explanation: string;
  xp: number;
  createdAt: string;
}
export interface GameState {
  version: 1;
  xp: number;
  discoveries: Discovery[];
  missions: Mission[];
  observationDays: string[];
  sound: boolean;
}
export interface SkyCandidate {
  id: ObjectId;
  altitude: number;
  azimuth: number;
  direction: string;
}
export interface ObservationContext {
  time: Date;
  latitude?: number;
  longitude?: number;
}
export interface Identification {
  object: ObjectId | null;
  confidence: number;
  fact: string;
  rarity: Rarity | null;
  provider: 'demo' | 'gemma';
}
export interface IdentificationInput {
  image: Blob;
  candidates: ObjectId[];
  context: ObservationContext;
  demoSignal?: 'clear' | 'weak';
}
export interface IdentificationProvider {
  identify(input: IdentificationInput, signal?: AbortSignal): Promise<Identification>;
}
export type Screen =
  'tonight' | 'expedition' | 'discovery' | 'collection' | 'missions' | 'builder' | 'mission-result';
