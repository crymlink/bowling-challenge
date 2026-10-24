/** Number of pins knocked down by a single roll. */
export type PinCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/**
 * Classification of a frame as soon as it can be determined.
 * `incomplete` means not enough rolls have been played to classify it yet.
 */
export type FrameType = 'strike' | 'spare' | 'open' | 'incomplete';

export interface Frame {
  /** 1-based frame number (1..10). */
  readonly number: number;
  /** Rolls played in this frame: 1–2 for frames 1–9, up to 3 for frame 10. */
  readonly rolls: readonly PinCount[];
  readonly type: FrameType;
  /** Pins plus bonus. `null` while the frame or its bonus rolls are still pending. */
  readonly score: number | null;
  /** Cumulative score up to and including this frame. `null` until the score is known. */
  readonly runningTotal: number | null;
}

/** Where the next roll will be played. */
export interface RollPosition {
  /** 1-based frame number (1..10). */
  readonly frame: number;
  /** 1-based roll within the frame (1..3). */
  readonly roll: number;
}

/** A roll together with the rack it was thrown at. */
export interface RackRoll {
  readonly pins: PinCount;
  /** Pins standing before the roll. */
  readonly standing: PinCount;
  /** Whether the roll was the first ball at a fresh rack. */
  readonly isFirstBall: boolean;
}

export interface GameState {
  readonly rolls: readonly PinCount[];
}
