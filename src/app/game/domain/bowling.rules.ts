import { Frame, FrameType, PinCount, Rack, RackRoll, RollPosition } from './bowling.models';

/**
 * Pure bowling scoring rules. Framework-free on purpose: everything is derived
 * from the list of rolls, so the same logic could validate a game on a backend.
 *
 * How the pieces fit together:
 *
 *   rolls ──buildFrames──▶ frames ──┬─▶ totalScore        (score shown under the sheet)
 *                                   ├─▶ nextRoll          (which frame/roll is next)
 *                                   ├─▶ pinsStanding      (max pins for the next roll)
 *                                   ├─▶ isGameOver
 *                                   └─▶ isValidRoll       (guards every new roll)
 *
 * 1. The store saves only the rolls: pin counts in the order they were thrown.
 * 2. `buildFrames` groups them into the 10 frames of the score sheet and scores each one.
 *    The store recomputes this whenever a roll is added.
 * 3. Every other question about the game is answered from those frames.
 *
 * Racks: a rack is the set of pins standing on the lane. It is never stored; it is replayed
 * from the rolls of one frame whenever it is needed, starting from `FRESH_RACK`. Two places
 * need it, and both go through the same rule, `nextRack`:
 * - `pinsStanding`: how many pins are left for the next roll of the current frame.
 * - `rackRolls`: what each roll of a frame was thrown at, so the score sheet can tell a
 *   strike or spare from a plain 10 or a plain count.
 * In frames 1–9 there is one rack per frame. In frame 10 a strike or spare sets up a fresh
 * rack within the same frame, which is why the rack has to be replayed instead of assumed.
 */

export const FRAME_COUNT = 10;
export const MAX_PINS = 10;
/** Rolls in a frame without a strike. */
const ROLLS_PER_FRAME = 2;
/** A strike ends frames 1–9 after a single roll. */
const STRIKE_ROLLS = 1;
/** Frame 10 allows a third roll after a strike or spare. */
const MAX_ROLLS_IN_LAST_FRAME = 3;
/** A strike scores the pins of the next two rolls as a bonus. */
const STRIKE_BONUS_ROLLS = 2;
/** A spare scores the pins of the next roll as a bonus. */
const SPARE_BONUS_ROLLS = 1;

/** All 10 pins set up: the start of every frame, and of every new rack in frame 10. */
const FRESH_RACK: Rack = { standing: MAX_PINS, isFirstBall: true };

/**
 * Whether a plain number is a possible result of one roll: a whole number from 0 to 10.
 * As a type guard it narrows `number` to `PinCount`, e.g. for user input before it reaches
 * the store. Whether the roll fits the current game is checked separately by `isValidRoll`.
 */
export function isPinCount(value: number): value is PinCount {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PINS;
}

/** Splits the rolls into all 10 frames, including scores and running totals. */
export function buildFrames(rolls: readonly PinCount[]): Frame[] {
  const frames: Frame[] = [];
  let start = 0;
  let runningTotal: number | null = 0;

  for (let number = 1; number <= FRAME_COUNT; number++) {
    // Frame 10 keeps all remaining rolls, including its bonus rolls.
    const frameRolls = number === FRAME_COUNT ? rolls.slice(start) : rollsOfFrame(rolls, start);
    const type = frameType(frameRolls);
    const score = frameScore(rolls, start, type);

    runningTotal = runningTotal === null || score === null ? null : runningTotal + score;
    frames.push({ number, rolls: frameRolls, type, score, runningTotal });
    start += frameRolls.length;
  }

  return frames;
}

/** The last known running total, or 0 before any frame is scored. */
export function totalScore(frames: readonly Frame[]): number {
  return frames.reduce((total, frame) => frame.runningTotal ?? total, 0);
}

/** The game is over once every frame, including frame 10 and its bonus rolls, is finished. */
export function isGameOver(frames: readonly Frame[]): boolean {
  return currentFrame(frames) === undefined;
}

/** Position of the next roll, or `null` when the game is over. */
export function nextRoll(frames: readonly Frame[]): RollPosition | null {
  const frame = currentFrame(frames);
  return frame ? { frame: frame.number, roll: frame.rolls.length + 1 } : null;
}

/** Maximum number of pins the next roll can knock down; 0 when the game is over. */
export function pinsStanding(frames: readonly Frame[]): PinCount {
  const frame = currentFrame(frames);
  return frame ? frame.rolls.reduce(nextRack, FRESH_RACK).standing : 0;
}

/** A roll is allowed while the game is running and it knocks down no more pins than are standing. */
export function isValidRoll(frames: readonly Frame[], pins: PinCount): boolean {
  return !isGameOver(frames) && pins <= pinsStanding(frames);
}

/**
 * Each roll of a frame with the rack it was thrown at, e.g. to tell a spare from a strike.
 * Frame 10 `[7, 3, 10]` gives 7 at 10 standing, 3 at 3 standing (spare),
 * then 10 at a fresh rack (strike).
 */
export function rackRolls(frameRolls: readonly PinCount[]): RackRoll[] {
  let rack = FRESH_RACK;
  return frameRolls.map((pins) => {
    const rackRoll = { pins, ...rack };
    rack = nextRack(rack, pins);
    return rackRoll;
  });
}

/** Boxes a frame has on the score sheet: 2 in frames 1–9, 3 in frame 10 including its bonus rolls. */
export function maxRollsInFrame(frameNumber: number): number {
  return frameNumber === FRAME_COUNT ? MAX_ROLLS_IN_LAST_FRAME : ROLLS_PER_FRAME;
}

/** Frames 1–9 end after a strike or after two rolls. */
function rollsOfFrame(rolls: readonly PinCount[], start: number): PinCount[] {
  const length = rolls[start] === MAX_PINS ? STRIKE_ROLLS : ROLLS_PER_FRAME;
  return rolls.slice(start, start + length);
}

function frameType(frameRolls: readonly PinCount[]): FrameType {
  const [first, second] = frameRolls;
  if (first === MAX_PINS) {
    return 'strike';
  }
  if (first === undefined || second === undefined) {
    return 'incomplete';
  }
  return first + second === MAX_PINS ? 'spare' : 'open';
}

/**
 * Strike: 10 + the next two rolls. Spare: 10 + the next roll. Open: the pins of both rolls.
 * In frame 10 the next rolls are its own bonus rolls. `null` while rolls are still pending.
 */
function frameScore(rolls: readonly PinCount[], start: number, type: FrameType): number | null {
  switch (type) {
    case 'strike':
      return allPinsPlusBonus(rolls, start + STRIKE_ROLLS, STRIKE_BONUS_ROLLS);
    case 'spare':
      return allPinsPlusBonus(rolls, start + ROLLS_PER_FRAME, SPARE_BONUS_ROLLS);
    case 'open':
      return sum(rolls.slice(start, start + ROLLS_PER_FRAME));
    case 'incomplete':
      return null;
  }
}

/** All 10 pins plus the pins of the bonus rolls, or `null` until they are played. */
function allPinsPlusBonus(
  rolls: readonly PinCount[],
  bonusStart: number,
  bonusRolls: number,
): number | null {
  const bonus = rolls.slice(bonusStart, bonusStart + bonusRolls);
  return bonus.length === bonusRolls ? MAX_PINS + sum(bonus) : null;
}

/** The frame the next roll belongs to, or `undefined` when the game is over. */
function currentFrame(frames: readonly Frame[]): Frame | undefined {
  return frames.find((frame) => !isFrameFinished(frame));
}

/** Frames 1–9 are finished once classified; frame 10 once its score is known. */
function isFrameFinished(frame: Frame): boolean {
  return frame.number === FRAME_COUNT ? frame.score !== null : frame.type !== 'incomplete';
}

/** Knocking down all standing pins sets up a fresh rack; mid-frame that only happens in frame 10. */
function nextRack(rack: Rack, pins: PinCount): Rack {
  return pins === rack.standing
    ? FRESH_RACK
    : { standing: toPinCount(rack.standing - pins), isFirstBall: false };
}

function sum(pins: readonly PinCount[]): number {
  return pins.reduce<number>((total, value) => total + value, 0);
}

function toPinCount(value: number): PinCount {
  if (!isPinCount(value)) {
    throw new RangeError(`Invalid pin count: ${value}`);
  }
  return value;
}
