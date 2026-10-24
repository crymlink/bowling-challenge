import { Frame, RollPosition } from './bowling.models';

/**
 * Pure bowling scoring rules. Framework-free on purpose: everything is derived
 * from the list of rolls, so the same logic could validate a game on a backend.
 * `buildFrames` groups the rolls into the 10 frames and scores each one; every other
 * question about the game is answered from those frames.
 */

export const FRAME_COUNT = 10;
export const MAX_PINS = 10;

/** Splits the rolls into all 10 frames, including scores and running totals. */
export function buildFrames(rolls: readonly number[]): Frame[] {
  const frames: Frame[] = [];
  let start = 0;
  let runningTotal: number | null = 0;

  for (let number = 1; number <= FRAME_COUNT; number++) {
    // Frame 10 keeps all remaining rolls, including its bonus rolls.
    const frameRolls = number === FRAME_COUNT ? rolls.slice(start) : rollsOfFrame(rolls, start);
    const score = frameScore(rolls, start);

    runningTotal = runningTotal === null || score === null ? null : runningTotal + score;
    frames.push({ number, rolls: frameRolls, score, runningTotal });
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

/** The cursor of current frame and cursor for the next roll, or `null` when the game is over. */
export function currentPosition(frames: readonly Frame[]): RollPosition | null {
  const frame = currentFrame(frames);
  return frame ? { frame: frame.number, roll: frame.rolls.length + 1 } : null;
}

/** Maximum number of pins the next roll can knock down; 0 when the game is over. */
export function pinsStanding(frames: readonly Frame[]): number {
  const frame = currentFrame(frames);
  if (!frame) {
    return 0;
  }
  const [first, second] = frame.rolls;
  if (second !== undefined) {
    // Third ball in frame 10: fresh pins after a spare or a second strike.
    return first === MAX_PINS && second < MAX_PINS ? MAX_PINS - second : MAX_PINS;
  }
  // Only frame 10 goes on after a strike, with fresh pins.
  return first === undefined || first === MAX_PINS ? MAX_PINS : MAX_PINS - first;
}

/** A roll is allowed while the game is running and it is a whole number up to the pins standing. */
export function isValidRoll(frames: readonly Frame[], pins: number): boolean {
  return !isGameOver(frames) && Number.isInteger(pins) && pins >= 0 && pins <= pinsStanding(frames);
}

/** Frames 1–9 end after a strike (a single roll) or after two rolls. */
function rollsOfFrame(rolls: readonly number[], start: number): number[] {
  return rolls.slice(start, rolls[start] === MAX_PINS ? start + 1 : start + 2);
}

/**
 * Strike: 10 + the next two rolls. Spare: 10 + the next roll. Open: the pins of both rolls.
 * A strike or spare therefore scores three rolls in a row from its first roll, an open frame two.
 * In frame 10 the next rolls are its own bonus rolls. `null` while rolls are still pending.
 */
function frameScore(rolls: readonly number[], start: number): number | null {
  const isStrikeOrSpare =
    rolls[start] === MAX_PINS || pinsDown(rolls.slice(start, start + 2)) === MAX_PINS;
  const count = isStrikeOrSpare ? 3 : 2;
  const scored = rolls.slice(start, start + count);
  return scored.length === count ? pinsDown(scored) : null;
}

/** The frame the next roll belongs to, or `undefined` when the game is over. */
function currentFrame(frames: readonly Frame[]): Frame | undefined {
  return frames.find((frame) => !isFrameFinished(frame));
}

/** Frames 1–9 are finished after a strike or two rolls; frame 10 once its score is known. */
function isFrameFinished(frame: Frame): boolean {
  return frame.number === FRAME_COUNT
    ? frame.score !== null
    : frame.rolls[0] === MAX_PINS || frame.rolls.length === 2;
}

/** Total pins knocked down by the given rolls. */
function pinsDown(rolls: readonly number[]): number {
  return rolls.reduce((total, pins) => total + pins, 0);
}
