import { Frame, FrameType, PinCount, RollPosition } from './bowling.models';

/**
 * Pure bowling scoring rules. Framework-free on purpose: everything is derived
 * from the list of rolls, so the same logic could validate a game on a backend.
 */

export const FRAME_COUNT = 10;
export const MAX_PINS = 10;
const LAST_FRAME_MAX_ROLLS = 3;

export function isPinCount(value: number): value is PinCount {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PINS;
}

/** Splits the rolls into all 10 frames, including scores and running totals. */
export function buildFrames(rolls: readonly PinCount[]): Frame[] {
  const frames: Frame[] = [];
  let rollIndex = 0;
  let runningTotal: number | null = 0;

  for (let number = 1; number <= FRAME_COUNT; number++) {
    const isLastFrame = number === FRAME_COUNT;
    const frameRolls = isLastFrame
      ? rolls.slice(rollIndex, rollIndex + LAST_FRAME_MAX_ROLLS)
      : regularFrameRolls(rolls, rollIndex);
    const type = frameType(frameRolls);
    const score = isLastFrame
      ? lastFrameScore(frameRolls)
      : regularFrameScore(rolls, rollIndex, frameRolls, type);

    runningTotal = runningTotal !== null && score !== null ? runningTotal + score : null;
    frames.push({ number, rolls: frameRolls, type, score, runningTotal });
    rollIndex += frameRolls.length;
  }

  return frames;
}

/** The last known running total, or 0 before any frame is scored. */
export function totalScore(frames: readonly Frame[]): number {
  return frames.reduce((total, frame) => frame.runningTotal ?? total, 0);
}

/** Position of the next roll, or `null` when the game is over. */
export function currentPosition(frames: readonly Frame[]): RollPosition | null {
  const frame = frames.find((candidate) => !isFrameFinished(candidate));
  return frame ? { frame: frame.number, roll: frame.rolls.length + 1 } : null;
}

export function isGameOver(frames: readonly Frame[]): boolean {
  return currentPosition(frames) === null;
}

/** Maximum number of pins the next roll can knock down; 0 when the game is over. */
export function pinsStanding(frames: readonly Frame[]): PinCount {
  const position = currentPosition(frames);
  const frame = position ? frames[position.frame - 1] : undefined;
  if (!frame) {
    return 0;
  }

  // In frame 10 the pins are reset after a strike or spare, so track the rack roll by roll.
  let standing = MAX_PINS;
  for (const pins of frame.rolls) {
    standing -= pins;
    if (standing === 0) {
      standing = MAX_PINS;
    }
  }
  return toPinCount(standing);
}

export function isValidRoll(rolls: readonly PinCount[], pins: PinCount): boolean {
  const frames = buildFrames(rolls);
  return !isGameOver(frames) && pins <= pinsStanding(frames);
}

function regularFrameRolls(rolls: readonly PinCount[], start: number): PinCount[] {
  const first = rolls[start];
  if (first === undefined) {
    return [];
  }
  if (first === MAX_PINS) {
    return [first];
  }
  const second = rolls[start + 1];
  return second === undefined ? [first] : [first, second];
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

function regularFrameScore(
  rolls: readonly PinCount[],
  start: number,
  frameRolls: readonly PinCount[],
  type: FrameType,
): number | null {
  switch (type) {
    case 'strike':
      return bonusScore(rolls, start + 1, 2);
    case 'spare':
      return bonusScore(rolls, start + 2, 1);
    case 'open':
      return sum(frameRolls);
    case 'incomplete':
      return null;
  }
}

/** All 10 pins plus the next `count` rolls, or `null` if those rolls haven't happened yet. */
function bonusScore(rolls: readonly PinCount[], start: number, count: number): number | null {
  const bonusRolls = rolls.slice(start, start + count);
  return bonusRolls.length === count ? MAX_PINS + sum(bonusRolls) : null;
}

/** Frame 10 has no bonus: its score is simply the sum of its rolls once it is finished. */
function lastFrameScore(frameRolls: readonly PinCount[]): number | null {
  return isLastFrameFinished(frameRolls) ? sum(frameRolls) : null;
}

function isFrameFinished(frame: Frame): boolean {
  if (frame.number === FRAME_COUNT) {
    return isLastFrameFinished(frame.rolls);
  }
  return frame.type !== 'incomplete';
}

/** Frame 10 ends after two rolls without strike/spare, otherwise after the third roll. */
function isLastFrameFinished(frameRolls: readonly PinCount[]): boolean {
  if (frameRolls.length === LAST_FRAME_MAX_ROLLS) {
    return true;
  }
  return frameRolls.length === 2 && sum(frameRolls) < MAX_PINS;
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
