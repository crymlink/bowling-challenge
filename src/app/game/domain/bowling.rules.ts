import { Frame, RollPosition } from './bowling.models';

/**
 * Pure bowling scoring rules. Framework-free on purpose: everything is derived
 * from the list of rolls, so the same logic could validate a game on a backend.
 * `buildFrames` groups the rolls into the 10 frames and scores each one; every other
 * question about the game is answered from those frames.
 */

export const FRAME_COUNT = 10;
export const MAX_PINS = 10;

/**
 * Splits the flat list of rolls into all 10 frames and scores each one.
 * Frames that have not been played yet get no rolls and a `null` score.
 */
export function buildFrames(rolls: number[]): Frame[] {
  const frames: Frame[] = [];
  // Index in `rolls` where the current frame's first roll is.
  let firstRollIndex = 0;
  // Score of all frames up to the current one; `null` once a frame cannot be scored yet.
  let runningTotal: number | null = 0;

  for (let frameNumber = 1; frameNumber <= FRAME_COUNT; frameNumber++) {
    const frameRolls = rollsOfFrame(rolls, frameNumber, firstRollIndex);
    const score = frameScore(rolls, firstRollIndex);

    if (score === null) {
      // This frame has no score yet, so the total from here on is not known either.
      runningTotal = null;
    } else if (runningTotal !== null) {
      runningTotal += score;
    }

    frames.push({ number: frameNumber, rolls: frameRolls, score, runningTotal });

    // The next frame's first roll comes right after this frame's rolls.
    firstRollIndex += frameRolls.length;
  }

  return frames;
}

/**
 * The score so far: the running total of the last frame that already has a score.
 */
export function totalScore(frames: Frame[]): number {
  return frames.reduce((total, frame) => frame.runningTotal ?? total, 0);
}

/** The game is over once every frame, including frame 10 and its bonus rolls, is finished. */
export function isGameOver(frames: Frame[]): boolean {
  return currentFrame(frames) === undefined;
}

/**
 * Where the next roll goes: which frame, and which roll within that frame.
 * E.g. `{ frame: 3, roll: 2 }` means the next ball is the second roll of frame 3.
 * `null` when the game is over.
 */
export function currentPosition(frames: Frame[]): RollPosition | null {
  const frame = currentFrame(frames);
  if (!frame) {
    return null;
  }

  // The next roll comes after the rolls this frame already has
  const nextRoll = frame.rolls.length + 1;
  return { frame: frame.number, roll: nextRoll };
}

/**
 * Maximum number of pins the next roll can knock down; 0 when the game is over.
 * Every frame starts with all 10 pins, and each roll takes its pins away.
 * Once all pins are down (a strike or a spare) they are set up again.
 */
export function pinsStanding(frames: Frame[]): number {
  const frame = currentFrame(frames);
  if (!frame) {
    return 0;
  }
  let standing = MAX_PINS;
  for (const pins of frame.rolls) {
    standing = standing - pins;
    if (standing === 0) {
      // Only frame 10 keeps going after a strike or spare, so only there does this reset matter.
      standing = MAX_PINS;
    }
  }
  return standing;
}

/** A roll is allowed while the game is running and it is a whole number up to the pins standing. */
export function isValidRoll(frames: Frame[], pins: number): boolean {
  if (isGameOver(frames)) {
    return false;
  }

  const isWholeNumber = Number.isInteger(pins);
  const isInRange = pins >= 0 && pins <= pinsStanding(frames);
  return isWholeNumber && isInRange;
}

/**
  The rolls of the frame whose first roll is at `firstRollIndex`. Frames 1–9 end after a strike (a single roll) or after two rolls.
  Frame 10 keeps all remaining rolls, including its bonus rolls.
*/
function rollsOfFrame(rolls: number[], frameNumber: number, firstRollIndex: number): number[] {
  if (frameNumber === FRAME_COUNT) {
    // No `to` index: take everything from `firstRollIndex` to the end.
    return rolls.slice(firstRollIndex);
  }

  const isStrike = rolls[firstRollIndex] === MAX_PINS;
  if (isStrike) {
    // Take 1 roll: from `firstRollIndex` up to (not including) `firstRollIndex + 1`.
    return rolls.slice(firstRollIndex, firstRollIndex + 1);
  }
  // Take 2 rolls: from `firstRollIndex` up to (not including) `firstRollIndex + 2`.
  return rolls.slice(firstRollIndex, firstRollIndex + 2);
}

/**
 * The score of the frame whose first roll is at `firstRollIndex`, or `null` while a needed roll is missing.
 * In frame 10 the "next" rolls are its own bonus rolls.
 */
function frameScore(rolls: number[], firstRollIndex: number): number | null {
  const first = rolls[firstRollIndex];
  const second = rolls[firstRollIndex + 1];
  const third = rolls[firstRollIndex + 2];

  if (first === undefined || second === undefined) {
    return null;
  }

  if (first === MAX_PINS) {
    // Strike: 10 + the next two rolls.
    return third === undefined ? null : MAX_PINS + second + third;
  }

  if (first + second === MAX_PINS) {
    // Spare: 10 + the next roll.
    return third === undefined ? null : MAX_PINS + third;
  }

  // Open frame: just the pins of both rolls.
  return first + second;
}

/** The frame the next roll belongs to, or `undefined` when the game is over. */
function currentFrame(frames: Frame[]): Frame | undefined {
  return frames.find((frame) => !isFrameFinished(frame));
}

/** Whether no more rolls belong to this frame. */
function isFrameFinished(frame: Frame): boolean {
  if (frame.number === FRAME_COUNT) {
    // Frame 10 is finished once its score is known: after 2 rolls if open, after 3 with a strike or spare.
    return frame.score !== null;
  }

  // Frames 1–9 are finished after a strike or after two rolls.
  const isStrike = frame.rolls[0] === MAX_PINS;
  const hasTwoRolls = frame.rolls.length === 2;
  return isStrike || hasTwoRolls;
}
