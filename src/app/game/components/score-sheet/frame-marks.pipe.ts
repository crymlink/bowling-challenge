import { Pipe, PipeTransform } from '@angular/core';
import { Frame } from '../../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS } from '../../domain/bowling.rules';

/**
 * Turns a frame's pin counts into the marks in its boxes, the way they appear on a paper
 * score sheet: 2 boxes in frames 1–9, 3 in frame 10, `''` for a box that hasn't been rolled.
 */
@Pipe({ name: 'frameMarks' })
export class FrameMarksPipe implements PipeTransform {
  transform({ number, rolls }: Frame): string[] {
    return number === FRAME_COUNT ? lastFrameMarks(rolls) : frameMarks(rolls);
  }
}

/** Frames 1–9: a strike goes in the right box. */
function frameMarks([first, second]: readonly number[]): string[] {
  if (first === MAX_PINS) {
    return ['', 'X'];
  }
  return [mark(first), mark(second, first)];
}

/**
 * Frame 10: a fresh rack of pins is set up after every strike or spare,
 * so each box is either the first ball at a fresh rack or the second ball at what was left.
 */
function lastFrameMarks([first, second, third]: readonly number[]): string[] {
  const secondAfter = first === MAX_PINS ? undefined : first;
  const thirdAfter = first === MAX_PINS && second !== MAX_PINS ? second : undefined;
  return [mark(first), mark(second, secondAfter), mark(third, thirdAfter)];
}

/**
 * The mark of one ball. `firstBall` is the ball before it in the same rack,
 * left out when this ball was rolled at a fresh rack of pins.
 */
function mark(pins: number | undefined, firstBall?: number): string {
  if (pins === undefined) {
    return '';
  }
  if (firstBall === undefined && pins === MAX_PINS) {
    return 'X';
  }
  if (firstBall !== undefined && firstBall + pins === MAX_PINS) {
    return '/';
  }
  return pins === 0 ? '-' : `${pins}`;
}
