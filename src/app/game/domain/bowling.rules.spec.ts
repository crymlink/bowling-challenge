import { PinCount } from './bowling.models';
import {
  buildFrames,
  currentPosition,
  isGameOver,
  isPinCount,
  isValidRoll,
  pinsStanding,
  totalScore,
} from './bowling.rules';

/**
 * These tests describe the rules of bowling, not the functions that implement them.
 * `play()` is the only place that knows the rules API, so the implementation can be
 * refactored freely as long as the game still behaves the same.
 */
function play(...rolls: PinCount[]) {
  const frames = buildFrames(rolls);
  return {
    frames,
    total: totalScore(frames),
    scores: frames.map((frame) => frame.score),
    runningTotals: frames.map((frame) => frame.runningTotal),
    rollsPerFrame: frames.map((frame) => frame.rolls),
    types: frames.map((frame) => frame.type),
    position: currentPosition(frames),
    pinsStanding: pinsStanding(frames),
    isGameOver: isGameOver(frames),
    canRoll: (pins: PinCount) => isValidRoll(frames, pins),
  };
}

/** Repeats a sequence of rolls, e.g. `repeat(9, 10)` for nine strikes. */
function repeat(times: number, ...rolls: PinCount[]): PinCount[] {
  return Array.from({ length: times }, () => rolls).flat();
}

describe('bowling rules', () => {
  describe('scoring complete games', () => {
    it.each<{ name: string; expected: number; rolls: PinCount[] }>([
      { name: 'gutter game', expected: 0, rolls: repeat(20, 0) },
      { name: 'all ones', expected: 20, rolls: repeat(20, 1) },
      { name: 'all nine-miss', expected: 90, rolls: repeat(10, 9, 0) },
      { name: 'all spares with 5 pins', expected: 150, rolls: repeat(21, 5) },
      { name: 'perfect game', expected: 300, rolls: repeat(12, 10) },
      {
        name: 'strike with 9-0 in the tenth frame',
        expected: 19,
        rolls: [...repeat(18, 0), 10, 9, 0],
      },
      {
        name: 'three strikes in the tenth frame',
        expected: 30,
        rolls: [...repeat(18, 0), 10, 10, 10],
      },
      {
        name: 'spare and strike in the tenth frame',
        expected: 20,
        rolls: [...repeat(18, 0), 7, 3, 10],
      },
      {
        name: 'open tenth frame after nine strikes',
        expected: 257,
        rolls: [...repeat(9, 10), 3, 4],
      },
    ])('$name scores $expected', ({ expected, rolls }) => {
      const game = play(...rolls);

      expect(game.total).toBe(expected);
      expect(game.isGameOver).toBe(true);
    });

    it('keeps a running total per frame', () => {
      const game = play(1, 4, 4, 5, 6, 4, 5, 5, 10, 0, 1, 7, 3, 6, 4, 10, 2, 8, 6);

      expect(game.runningTotals).toEqual([5, 14, 29, 49, 60, 61, 77, 97, 117, 133]);
      expect(game.total).toBe(133);
    });
  });

  describe('frames', () => {
    it('always has 10 frames, also before the first roll', () => {
      const game = play();

      expect(game.frames.map((frame) => frame.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(game.rollsPerFrame).toEqual(Array.from({ length: 10 }, () => []));
      expect(game.total).toBe(0);
    });

    it('a strike ends the frame after one roll', () => {
      const game = play(10, 3);

      expect(game.rollsPerFrame.slice(0, 2)).toEqual([[10], [3]]);
    });

    it('a frame without strike has two rolls', () => {
      const game = play(3, 4, 5);

      expect(game.rollsPerFrame.slice(0, 2)).toEqual([[3, 4], [5]]);
    });

    it('classifies frames as strike, spare, open or incomplete', () => {
      const game = play(10, 7, 3, 4, 5, 6);

      expect(game.types.slice(0, 5)).toEqual([
        'strike',
        'spare',
        'open',
        'incomplete',
        'incomplete',
      ]);
    });

    it('the tenth frame holds its bonus rolls', () => {
      const game = play(...repeat(18, 0), 10, 3, 7);

      expect(game.rollsPerFrame[9]).toEqual([10, 3, 7]);
    });
  });

  describe('bonuses', () => {
    it('a spare scores 10 plus the next roll', () => {
      expect(play(5, 5, 3, 0).scores.slice(0, 2)).toEqual([13, 3]);
    });

    it('a strike scores 10 plus the next two rolls', () => {
      expect(play(10, 3, 4).scores.slice(0, 2)).toEqual([17, 7]);
    });

    it('consecutive strikes count each other as bonus', () => {
      expect(play(10, 10, 10).scores[0]).toBe(30);
    });

    it('a spare score is pending until the next roll', () => {
      expect(play(5, 5).scores[0]).toBeNull();
      expect(play(5, 5, 3).scores[0]).toBe(13);
    });

    it('a strike score is pending until the next two rolls', () => {
      expect(play(10).scores[0]).toBeNull();
      expect(play(10, 3).scores[0]).toBeNull();
      expect(play(10, 3, 4).scores[0]).toBe(17);
    });

    it('running totals stop at the first pending frame', () => {
      const game = play(3, 4, 10, 2);

      expect(game.runningTotals.slice(0, 3)).toEqual([7, null, null]);
      expect(game.total).toBe(7);
    });
  });

  describe('game progress', () => {
    it('starts at frame 1, roll 1', () => {
      expect(play().position).toEqual({ frame: 1, roll: 1 });
    });

    it('moves to the second roll after a non-strike', () => {
      expect(play(3).position).toEqual({ frame: 1, roll: 2 });
    });

    it('moves to the next frame after a strike', () => {
      expect(play(10).position).toEqual({ frame: 2, roll: 1 });
    });

    it('allows a third roll in the tenth frame after a strike', () => {
      const game = play(...repeat(18, 0), 10, 3);

      expect(game.position).toEqual({ frame: 10, roll: 3 });
      expect(game.isGameOver).toBe(false);
    });

    it('allows a third roll in the tenth frame after a spare', () => {
      const game = play(...repeat(18, 0), 7, 3);

      expect(game.position).toEqual({ frame: 10, roll: 3 });
      expect(game.isGameOver).toBe(false);
    });

    it('ends after two rolls in an open tenth frame', () => {
      const game = play(...repeat(18, 0), 3, 4);

      expect(game.position).toBeNull();
      expect(game.isGameOver).toBe(true);
    });

    it('ends after the third roll in the tenth frame', () => {
      const game = play(...repeat(18, 0), 10, 10, 10);

      expect(game.position).toBeNull();
      expect(game.isGameOver).toBe(true);
    });
  });

  describe('allowed rolls', () => {
    it('all 10 pins are standing at the start of a frame', () => {
      const game = play(3, 4);

      expect(game.pinsStanding).toBe(10);
      expect(game.canRoll(10)).toBe(true);
    });

    it('only the remaining pins can be knocked down on the second roll', () => {
      const game = play(7);

      expect(game.pinsStanding).toBe(3);
      expect(game.canRoll(3)).toBe(true);
      expect(game.canRoll(4)).toBe(false);
    });

    it.each<{ name: string; tenthFrame: PinCount[]; standing: PinCount }>([
      { name: 'a strike', tenthFrame: [10], standing: 10 },
      { name: 'a strike and 3 pins', tenthFrame: [10, 3], standing: 7 },
      { name: 'two strikes', tenthFrame: [10, 10], standing: 10 },
      { name: 'a spare', tenthFrame: [7, 3], standing: 10 },
    ])('in the tenth frame the pins are reset after $name', ({ tenthFrame, standing }) => {
      const game = play(...repeat(18, 0), ...tenthFrame);

      expect(game.pinsStanding).toBe(standing);
      expect(game.canRoll(standing)).toBe(true);
    });

    it('no roll is allowed after the game is over', () => {
      const game = play(...repeat(20, 0));

      expect(game.pinsStanding).toBe(0);
      expect(game.canRoll(0)).toBe(false);
    });
  });

  describe('pin counts', () => {
    it.each([0, 5, 10])('%d is a valid pin count', (value) => {
      expect(isPinCount(value)).toBe(true);
    });

    it.each([-1, 11, 2.5, Number.NaN])('%d is not a valid pin count', (value) => {
      expect(isPinCount(value)).toBe(false);
    });
  });
});
