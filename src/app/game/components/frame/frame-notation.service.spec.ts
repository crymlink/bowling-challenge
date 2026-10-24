import { TestBed } from '@angular/core/testing';
import { PinCount } from '../../domain/bowling.models';
import { buildFrames } from '../../domain/bowling.rules';
import { FrameNotationService } from './frame-notation.service';

/**
 * These tests describe how a score sheet is written, not the methods behind it.
 * `sheet()` is the only place that knows the notation API.
 */
function sheet(...rolls: PinCount[]) {
  const notation = TestBed.inject(FrameNotationService);
  return buildFrames(rolls).map((frame) => notation.toMarks(frame));
}

/** Rolls that leave frames 1–9 open with 0 pins, so a test can focus on frame 10. */
const NINE_GUTTER_FRAMES: PinCount[] = Array.from({ length: 18 }, () => 0);

function tenthFrame(...rolls: PinCount[]) {
  const frame = sheet(...NINE_GUTTER_FRAMES, ...rolls)[9];
  if (!frame) {
    throw new Error('A game always has 10 frames');
  }
  return frame;
}

describe('score sheet notation', () => {
  it.each<[string, PinCount[], (string | null)[]]>([
    ['a strike as X', [10], ['X', null]],
    ['a spare as /', [7, 3], ['7', '/']],
    ['a gutter ball as -', [0, 4], ['-', '4']],
    ['knocking down all 10 pins with the second ball as a spare', [0, 10], ['-', '/']],
    ['an open frame as the pins of each roll', [3, 4], ['3', '4']],
    ['a frame after one roll with an empty second box', [5], ['5', null]],
    ['an unplayed frame with empty boxes', [], [null, null]],
  ])('shows %s', (_name, rolls, expected) => {
    expect(sheet(...rolls)[0]).toEqual(expected);
  });

  it.each<[string, PinCount[], (string | null)[]]>([
    ['three strikes', [10, 10, 10], ['X', 'X', 'X']],
    ['a strike followed by a spare', [10, 3, 7], ['X', '3', '/']],
    ['a spare followed by a strike', [7, 3, 10], ['7', '/', 'X']],
    ['a strike, a gutter ball and a spare', [10, 0, 10], ['X', '-', '/']],
    ['an open frame without a third roll', [3, 4], ['3', '4', null]],
  ])('shows %s in the tenth frame', (_name, rolls, expected) => {
    expect(tenthFrame(...rolls)).toEqual(expected);
  });
});
