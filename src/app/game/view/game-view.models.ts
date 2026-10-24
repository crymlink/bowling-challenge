/** Classic score sheet notation for a single roll. */
export type RollMark = 'X' | '/' | '-' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export interface FrameView {
  readonly number: number;
  /** One slot per box on the sheet: 2 for frames 1–9, 3 for frame 10. `null` = not rolled. */
  readonly marks: readonly (RollMark | null)[];
  readonly runningTotal: number | null;
  readonly isCurrent: boolean;
  /** Full text description for screen readers, e.g. "Frame 3: 7, spare. Total 25". */
  readonly description: string;
}
