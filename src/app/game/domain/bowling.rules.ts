import { Frame, FrameType, PinCount, RollPosition } from './bowling.models';

/**
 * Pure bowling scoring rules. Framework-free on purpose: everything is derived
 * from the list of rolls, so the same logic could validate a game on a backend.
 */

export const FRAME_COUNT = 10;
export const MAX_PINS = 10;

/**
 * Number of consecutive rolls, starting at a frame's first roll, that make up its score.
 * Strike: 10 + next two rolls. Spare: both rolls + next roll. Open: both rolls.
 * This holds for frame 10 as well; its bonus rolls are simply played inside the frame.
 */
const SCORED_ROLLS: Record<Exclude<FrameType, 'incomplete'>, number> = {
  strike: 3,
  spare: 3,
  open: 2,
};

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

/** The game is over as soon as frame 10 has a score. */
export function isGameOver(frames: readonly Frame[]): boolean {
  const lastFrame = frames[FRAME_COUNT - 1];
  return lastFrame !== undefined && lastFrame.score !== null;
}

/** Position of the next roll, or `null` when the game is over. */
export function currentPosition(frames: readonly Frame[]): RollPosition | null {
  const frame = currentFrame(frames);
  return frame ? { frame: frame.number, roll: frame.rolls.length + 1 } : null;
}

/** Maximum number of pins the next roll can knock down; 0 when the game is over. */
export function pinsStanding(frames: readonly Frame[]): PinCount {
  const frame = currentFrame(frames);
  if (!frame) {
    return 0;
  }
  // Knocking down all pins resets the rack; mid-frame that only happens in frame 10.
  return toPinCount(MAX_PINS - (sum(frame.rolls) % MAX_PINS));
}

export function isValidRoll(frames: readonly Frame[], pins: PinCount): boolean {
  return !isGameOver(frames) && pins <= pinsStanding(frames);
}

/** Frames 1–9 end after a strike or after two rolls. */
function rollsOfFrame(rolls: readonly PinCount[], start: number): PinCount[] {
  const length = rolls[start] === MAX_PINS ? 1 : 2;
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

/** `null` while the frame or its bonus rolls are still pending. */
function frameScore(rolls: readonly PinCount[], start: number, type: FrameType): number | null {
  if (type === 'incomplete') {
    return null;
  }
  const scoredRolls = rolls.slice(start, start + SCORED_ROLLS[type]);
  return scoredRolls.length === SCORED_ROLLS[type] ? sum(scoredRolls) : null;
}

/** The frame the next roll belongs to, or `undefined` when the game is over. */
function currentFrame(frames: readonly Frame[]): Frame | undefined {
  return frames.find((frame) => !isFrameFinished(frame));
}

/** Frames 1–9 are finished once classified; frame 10 once its score is known. */
function isFrameFinished(frame: Frame): boolean {
  return frame.number === FRAME_COUNT ? frame.score !== null : frame.type !== 'incomplete';
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
