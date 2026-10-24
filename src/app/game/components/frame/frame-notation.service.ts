import { Service } from '@angular/core';
import { Frame, PinCount } from '../../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS } from '../../domain/bowling.rules';

/** Classic score sheet notation for a single roll. */
export type RollMark = 'X' | '/' | '-' | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

/** Writes frames the way they appear on a bowling score sheet. */
@Service()
export class FrameNotationService {
  /**
   * One mark per box: 2 for frames 1–9, 3 for frame 10. `null` marks a box that hasn't been rolled.
   * X = all pins with the first ball of a rack, / = all remaining pins with the second ball.
   */
  toMarks(frame: Frame): (RollMark | null)[] {
    const marks: (RollMark | null)[] = [];
    let isFirstBall = true;
    let standing = MAX_PINS;

    for (const pins of frame.rolls) {
      const clearsRack = pins === standing;
      marks.push(clearsRack && !isFirstBall ? '/' : this.pinMark(pins));
      // A strike or spare sets up a fresh rack (only possible mid-frame in frame 10).
      isFirstBall = clearsRack;
      standing = clearsRack ? MAX_PINS : standing - pins;
    }

    const boxes = frame.number === FRAME_COUNT ? 3 : 2;
    while (marks.length < boxes) {
      marks.push(null);
    }
    return marks;
  }

  private pinMark(pins: PinCount): RollMark {
    if (pins === MAX_PINS) {
      return 'X';
    }
    if (pins === 0) {
      return '-';
    }
    return `${pins}`;
  }
}
