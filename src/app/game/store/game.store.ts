import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { GameState, PinCount } from '../domain/bowling.models';
import {
  buildFrames,
  currentPosition,
  isGameOver,
  isValidRoll,
  pinsStanding,
  totalScore,
} from '../domain/bowling.rules';

const initialState: GameState = { rolls: [] };

/**
 * Domain state of the current game. The rolls are the single source of truth;
 * everything else is derived. This is deliberately free of UI concerns (labels,
 * notation, randomness) so it is the natural place to sync the game with a backend.
 */
export const GameStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rolls }) => {
    const frames = computed(() => buildFrames(rolls()));
    return {
      frames,
      totalScore: computed(() => totalScore(frames())),
      pinsStanding: computed(() => pinsStanding(frames())),
      currentPosition: computed(() => currentPosition(frames())),
      isGameOver: computed(() => isGameOver(frames())),
      canUndo: computed(() => rolls().length > 0),
    };
  }),
  withMethods((store) => ({
    /** Records a roll. Invalid rolls are ignored as a domain-level safety net. */
    roll(pins: PinCount): void {
      if (!isValidRoll(store.rolls(), pins)) {
        return;
      }
      patchState(store, { rolls: [...store.rolls(), pins] });
    },
    undo(): void {
      patchState(store, { rolls: store.rolls().slice(0, -1) });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
