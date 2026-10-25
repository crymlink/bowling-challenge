export interface Frame {
  /** 1-based frame number (1..10). */
  readonly number: number;
  /** Pins of each roll: 1–2 for frames 1–9, up to 3 for frame 10. */
  readonly rolls: number[];
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
