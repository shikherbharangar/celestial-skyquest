import { useEffect, useState } from 'react';
import { initialState, isGameState } from '../game/progression';
import { setSoundEnabled } from '../services/audio';
const KEY = 'celestial.field-journal.v1';
export function useGame() {
  const [storageWarning, setStorageWarning] = useState('');
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      const value: unknown = saved ? JSON.parse(saved) : null;
      return isGameState(value) ? value : initialState();
    } catch {
      return initialState();
    }
  });
  useEffect(() => {
    setSoundEnabled(game.sound);
    try {
      localStorage.setItem(KEY, JSON.stringify(game));
    } catch {
      setStorageWarning(
        'Your journal is kept for this visit. Browser storage is unavailable, so it may not survive a refresh.',
      );
    }
  }, [game]);
  return { game, setGame, storageWarning };
}
