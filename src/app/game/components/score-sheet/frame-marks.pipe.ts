import { Pipe, PipeTransform } from '@angular/core';
import { Frame } from '../../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS } from '../../domain/bowling.rules';

/**
 * Turns a frame's rolls into the marks in its boxes, like on a paper score sheet:
 * X = strike, / = spare, - = gutter ball, '' = not rolled yet.
 * Frames 1–9 have 2 boxes, frame 10 has 3.
 */
@Pipe({ name: 'frameMarks' })
export class FrameMarksPipe implements PipeTransform {
  transform({ number, rolls }: Frame): string[] {
    const isTenthFrame = number === FRAME_COUNT;

    // Frames 1–9: a strike ends the frame, and the X goes in the right box.
    if (!isTenthFrame && rolls[0] === MAX_PINS) {
      return ['', 'X'];
    }

    // One empty box per possible ball; boxes that are not rolled yet stay empty.
    const marks = ['', ''];
    if (isTenthFrame) {
      marks.push('');
    }

    // The ball before this one at the same pins; `undefined` while all 10 pins are standing.
    let previousBall: number | undefined;

    rolls.forEach((pins, index) => {
      marks[index] = mark(pins, previousBall);

      // After a strike or a second ball, all 10 pins are set up again (only happens in frame 10).
      if (previousBall === undefined && pins !== MAX_PINS) {
        previousBall = pins;
      } else {
        previousBall = undefined;
      }
    });

    return marks;
  }
}

/** X for a strike, / for a spare, - for a gutter ball, otherwise the number of pins. */
function mark(pins: number, previousBall: number | undefined): string {
  // Strike: all 10 pins down with a ball rolled at a full rack.
  if (previousBall === undefined && pins === MAX_PINS) {
    return 'X';
  }
  // Spare: this ball knocks down all the pins the previous ball left, e.g. 7 then 3.
  if (previousBall !== undefined && previousBall + pins === MAX_PINS) {
    return '/';
  }
  if (pins === 0) {
    return '-';
  }
  return String(pins);
}
