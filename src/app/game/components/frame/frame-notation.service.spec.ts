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
  it.each<{ name: string; rolls: PinCount[]; marks: (string | null)[] }>([
    { name: 'a strike as X', rolls: [10], marks: ['X', null] },
    { name: 'a spare as /', rolls: [7, 3], marks: ['7', '/'] },
    { name: 'a gutter ball as -', rolls: [0, 4], marks: ['-', '4'] },
    {
      name: 'knocking down all 10 pins with the second ball as a spare',
      rolls: [0, 10],
      marks: ['-', '/'],
    },
    { name: 'an open frame as the pins of each roll', rolls: [3, 4], marks: ['3', '4'] },
    { name: 'a frame after one roll with an empty second box', rolls: [5], marks: ['5', null] },
    { name: 'an unplayed frame with empty boxes', rolls: [], marks: [null, null] },
  ])('shows $name', ({ rolls, marks }) => {
    expect(sheet(...rolls)[0]).toEqual(marks);
  });

  it.each<{ name: string; rolls: PinCount[]; marks: (string | null)[] }>([
    { name: 'three strikes', rolls: [10, 10, 10], marks: ['X', 'X', 'X'] },
    { name: 'a strike followed by a spare', rolls: [10, 3, 7], marks: ['X', '3', '/'] },
    { name: 'a spare followed by a strike', rolls: [7, 3, 10], marks: ['7', '/', 'X'] },
    { name: 'a strike, a gutter ball and a spare', rolls: [10, 0, 10], marks: ['X', '-', '/'] },
    { name: 'an open frame without a third roll', rolls: [3, 4], marks: ['3', '4', null] },
  ])('shows $name in the tenth frame', ({ rolls, marks }) => {
    expect(tenthFrame(...rolls)).toEqual(marks);
  });
});
