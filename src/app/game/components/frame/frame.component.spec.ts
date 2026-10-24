import { TestBed } from '@angular/core/testing';
import { PinCount } from '../../domain/bowling.models';
import { buildFrames } from '../../domain/bowling.rules';
import { FrameComponent } from './frame.component';

/**
 * These tests read a frame the way a player reads the score sheet: the marks in its boxes and
 * its running total. `render()` is the only place that knows the component's input and markup.
 */
async function render(frameNumber: number, ...rolls: PinCount[]) {
  const fixture = TestBed.createComponent(FrameComponent);
  fixture.componentRef.setInput('frame', buildFrames(rolls)[frameNumber - 1]);
  await fixture.whenStable();

  const element: HTMLElement = fixture.nativeElement;
  return {
    /** One entry per box, `''` for a box that hasn't been rolled. */
    marks: () => [...element.querySelectorAll('.mark')].map((mark) => mark.textContent?.trim()),
    runningTotal: () => element.querySelector('.running-total')?.textContent?.trim(),
  };
}

/** Rolls that leave frames 1–9 open with 0 pins, so a test can focus on frame 10. */
const NINE_GUTTER_FRAMES: PinCount[] = Array.from({ length: 18 }, () => 0);

describe('FrameComponent', () => {
  it.each<{ name: string; rolls: PinCount[]; marks: string[] }>([
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
  ])('shows $name', async ({ rolls, marks }) => {
    const frame = await render(1, ...rolls);

    expect(frame.marks()).toEqual(marks);
  });

  it.each<{ name: string; rolls: PinCount[]; marks: string[] }>([
    { name: 'three strikes', rolls: [10, 10, 10], marks: ['X', 'X', 'X'] },
    { name: 'a strike followed by a spare', rolls: [10, 3, 7], marks: ['X', '3', '/'] },
    { name: 'a spare followed by a strike', rolls: [7, 3, 10], marks: ['7', '/', 'X'] },
    { name: 'a strike, a gutter ball and a spare', rolls: [10, 0, 10], marks: ['X', '-', '/'] },
    { name: 'an open frame without a third roll', rolls: [3, 4], marks: ['3', '4', ''] },
  ])('shows $name in the tenth frame', async ({ rolls, marks }) => {
    const frame = await render(10, ...NINE_GUTTER_FRAMES, ...rolls);

    expect(frame.marks()).toEqual(marks);
  });

  it('shows the running total once the score is known', async () => {
    const frame = await render(2, 10, 3, 4);

    expect(frame.runningTotal()).toBe('24');
  });

  it('leaves the running total empty while a bonus is pending', async () => {
    const frame = await render(1, 7, 3);

    expect(frame.runningTotal()).toBe('');
  });
});
