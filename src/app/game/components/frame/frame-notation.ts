import { Frame, PinCount } from '../../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS, maxRollsInFrame, rackRolls } from '../../domain/bowling.rules';

/** Classic score sheet notation for a single roll. */
export type RollMark = 'X' | '/' | '-' | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

/**
 * Writes a frame the way it appears on a bowling score sheet.
 * One mark per box: 2 for frames 1–9, 3 for frame 10. `null` marks a box that hasn't been rolled.
 * X = all pins with the first ball of a rack, / = all remaining pins with the second ball.
 */
export function toMarks(frame: Frame): (RollMark | null)[] {
  // A strike in frames 1–9 goes in the right box, like on a paper score sheet.
  if (frame.type === 'strike' && frame.number !== FRAME_COUNT) {
    return [null, 'X'];
  }
  const marks = rackRolls(frame.rolls).map(({ pins, standing, isFirstBall }) =>
    pins === standing && !isFirstBall ? '/' : pinMark(pins),
  );
  return Array.from({ length: maxRollsInFrame(frame.number) }, (_, box) => marks[box] ?? null);
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
