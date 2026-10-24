import { TestBed } from '@angular/core/testing';
import { PinCount } from '../domain/bowling.models';
import { GameStore } from './game.store';

/**
 * These tests describe the lifecycle of a game held by the store, not its internals.
 * The rules themselves are covered by the bowling rules tests; here we only check that the
 * store wires them up. `game()` is the only place that knows how the store is created and fed.
 */
function game(...rolls: PinCount[]) {
  const store = TestBed.inject(GameStore);
  rolls.forEach((pins) => store.roll(pins));
  return store;
}

/** Repeats a sequence of rolls, e.g. `repeat(9, 10)` for nine strikes. */
function repeat(times: number, ...rolls: PinCount[]): PinCount[] {
  return Array.from({ length: times }, () => rolls).flat();
}

describe('GameStore', () => {
  it('starts with an empty game', () => {
    const store = game();

    expect(store.rolls()).toEqual([]);
    expect(store.totalScore()).toBe(0);
    expect(store.currentPosition()).toEqual({ frame: 1, roll: 1 });
    expect(store.pinsStanding()).toBe(10);
    expect(store.isGameOver()).toBe(false);
  });

  it('records valid rolls and derives the game state from them', () => {
    const store = game(7, 3, 5);

    expect(store.rolls()).toEqual([7, 3, 5]);
    expect(store.frames()[0]?.score).toBe(15);
    expect(store.totalScore()).toBe(15);
    expect(store.currentPosition()).toEqual({ frame: 2, roll: 2 });
    expect(store.pinsStanding()).toBe(5);
  });

  it('ignores rolls the rules do not allow', () => {
    const store = game(7, 4);

    expect(store.rolls()).toEqual([7]);
  });

  it('starts a fresh game on reset', () => {
    const store = game(...repeat(12, 10));
    store.reset();

    expect(store.rolls()).toEqual([]);
    expect(store.totalScore()).toBe(0);
    expect(store.isGameOver()).toBe(false);
  });
});
