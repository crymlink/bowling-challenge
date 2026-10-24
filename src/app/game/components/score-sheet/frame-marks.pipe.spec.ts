import { buildFrames } from '../../domain/bowling.rules';
import { FrameMarksPipe } from './frame-marks.pipe';

/** The marks a player sees in the boxes of one frame after the given rolls. */
function marks(frameNumber: number, ...rolls: number[]): string[] {
  return new FrameMarksPipe().transform(buildFrames(rolls)[frameNumber - 1]!);
}

/** Rolls that leave frames 1–9 open with 0 pins, so a test can focus on frame 10. */
const NINE_GUTTER_FRAMES: number[] = Array.from({ length: 18 }, () => 0);

describe('FrameMarksPipe', () => {
  it.each<{ name: string; rolls: number[]; marks: string[] }>([
    { name: 'a strike as X in the right box', rolls: [10], marks: ['', 'X'] },
    { name: 'a spare as /', rolls: [7, 3], marks: ['7', '/'] },
    { name: 'a gutter ball as -', rolls: [0, 4], marks: ['-', '4'] },
    {
      name: 'knocking down all 10 pins with the second ball as a spare',
      rolls: [0, 10],
      marks: ['-', '/'],
    },
    { name: 'an open frame as the pins of each roll', rolls: [3, 4], marks: ['3', '4'] },
    { name: 'a frame after one roll with an empty second box', rolls: [5], marks: ['5', ''] },
    { name: 'an unplayed frame with empty boxes', rolls: [], marks: ['', ''] },
  ])('shows $name', ({ rolls, marks: expected }) => {
    expect(marks(1, ...rolls)).toEqual(expected);
  });

  it.each<{ name: string; rolls: number[]; marks: string[] }>([
    { name: 'three strikes', rolls: [10, 10, 10], marks: ['X', 'X', 'X'] },
    { name: 'a strike followed by a spare', rolls: [10, 3, 7], marks: ['X', '3', '/'] },
    { name: 'a spare followed by a strike', rolls: [7, 3, 10], marks: ['7', '/', 'X'] },
    { name: 'a strike, a gutter ball and a spare', rolls: [10, 0, 10], marks: ['X', '-', '/'] },
    { name: 'an open frame without a third roll', rolls: [3, 4], marks: ['3', '4', ''] },
  ])('shows $name in the tenth frame', ({ rolls, marks: expected }) => {
    expect(marks(10, ...NINE_GUTTER_FRAMES, ...rolls)).toEqual(expected);
  });
});
