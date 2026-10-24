import { Component, computed, input } from '@angular/core';
import { Frame, PinCount } from '../../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS, rackRolls } from '../../domain/bowling.rules';

/** Classic score sheet notation for a single roll. */
type RollMark = 'X' | '/' | '-' | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

/** Boxes on the score sheet: 2 in frames 1–9, 3 in frame 10 for its bonus rolls. */
const BOXES_PER_FRAME = 2;
const BOXES_IN_LAST_FRAME = 3;

/** One frame of the score sheet, written the way it appears on a paper score sheet. */
@Component({
  selector: 'app-frame',
  templateUrl: './frame.component.html',
  styleUrl: './frame.component.scss',
})
export class FrameComponent {
  readonly frame = input.required<Frame>();

  protected readonly marks = computed(() => toMarks(this.frame()));
}

/**
 * One mark per box. `null` marks a box that hasn't been rolled.
 * X = all pins with the first ball of a rack, / = all remaining pins with the second ball.
 */
function toMarks(frame: Frame): (RollMark | null)[] {
  // A strike in frames 1–9 goes in the right box, like on a paper score sheet.
  if (frame.type === 'strike' && frame.number !== FRAME_COUNT) {
    return [null, 'X'];
  }
  const marks = rackRolls(frame.rolls).map(({ pins, standing, isFirstBall }) =>
    pins === standing && !isFirstBall ? '/' : pinMark(pins),
  );
  const boxes = frame.number === FRAME_COUNT ? BOXES_IN_LAST_FRAME : BOXES_PER_FRAME;
  return Array.from({ length: boxes }, (_, box) => marks[box] ?? null);
}

function pinMark(pins: PinCount): RollMark {
  if (pins === MAX_PINS) {
    return 'X';
  }
  if (pins === 0) {
    return '-';
  }
  return `${pins}`;
}
