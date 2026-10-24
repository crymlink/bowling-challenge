import { TestBed } from '@angular/core/testing';
import { GamePageComponent } from './game-page.component';

const BUTTONS = {
  roll: 'app-roll-input button[type="submit"]',
  random: 'app-roll-input button[type="button"]',
  newGame: 'app-game-controls button',
};

/**
 * These tests play the game through the real page: typing rolls, clicking buttons and
 * reading the score sheet. `render()` is the only place that knows the page's markup.
 */
async function render() {
  const fixture = TestBed.createComponent(GamePageComponent);
  await fixture.whenStable();

  const element: HTMLElement = fixture.nativeElement;
  const input = element.querySelector('input')!;
  const button = (name: keyof typeof BUTTONS) =>
    element.querySelector<HTMLButtonElement>(BUTTONS[name])!;
  const text = (selector: string) =>
    element.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  const type = async (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const click = async (name: keyof typeof BUTTONS) => {
    button(name).click();
    await fixture.whenStable();
  };

  return {
    async roll(...rolls: number[]) {
      for (const pins of rolls) {
        await type(String(pins));
        await click('roll');
      }
    },
    type,
    click,
    /** Marks and running total per frame, e.g. "7 /" and "15". */
    frames: () =>
      [...element.querySelectorAll('app-frame')].map((frame) => ({
        marks: [...frame.querySelectorAll('.mark')]
          .map((mark) => mark.textContent?.trim())
          .filter(Boolean)
          .join(' '),
        total: frame.querySelector('.running-total')?.textContent?.trim() ?? '',
      })),
    currentFrame: () =>
      [...element.querySelectorAll('app-frame')].findIndex((frame) =>
        frame.classList.contains('current'),
      ) + 1,
    status: () => text('.status'),
    totalScore: () => text('.total-score'),
    error: () => text('.error'),
    inputValue: () => input.value,
    isDisabled: (name: keyof typeof BUTTONS) => button(name).disabled,
  };
}

describe('GamePageComponent', () => {
  it('starts with an empty score sheet at frame 1', async () => {
    const page = await render();

    expect(page.status()).toBe('Frame 1 · Roll 1 · 10 pins standing');
    expect(page.frames()).toHaveLength(10);
    expect(page.currentFrame()).toBe(1);
    expect(page.totalScore()).toBe('Total score: 0');
  });

  it('writes rolls and scores onto the score sheet', async () => {
    const page = await render();
    await page.roll(7, 3, 10, 2, 4);

    expect(page.frames().slice(0, 4)).toEqual([
      { marks: '7 /', total: '20' },
      { marks: 'X', total: '36' },
      { marks: '2 4', total: '42' },
      { marks: '', total: '' },
    ]);
    expect(page.currentFrame()).toBe(4);
    expect(page.totalScore()).toBe('Total score: 42');
  });

  it('plays a perfect game to the end', async () => {
    const page = await render();
    await page.roll(...Array.from({ length: 12 }, () => 10));

    expect(page.status()).toBe('Game over — final score 300');
    expect(page.frames()[9]).toEqual({ marks: 'X X X', total: '300' });
    expect(page.currentFrame()).toBe(0);
    expect(page.isDisabled('roll')).toBe(true);
    expect(page.isDisabled('random')).toBe(true);
  });

  it('plays a whole game with random rolls', async () => {
    // Every random roll knocks down half of the standing pins, rounded down: 5, then 3.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const page = await render();
    // A game has at most 21 rolls, so the loop can never run forever.
    for (let rolls = 0; rolls < 21 && !page.isDisabled('random'); rolls++) {
      await page.click('random');
    }

    expect(page.status()).toBe('Game over — final score 80');
    expect(page.frames()[9]).toEqual({ marks: '5 3', total: '80' });
  });

  it('starts a new game and clears the input', async () => {
    const page = await render();
    await page.roll(10, 10, 10);
    await page.type('12');
    await page.click('newGame');

    expect(page.status()).toBe('Frame 1 · Roll 1 · 10 pins standing');
    expect(page.frames().every((frame) => frame.marks === '' && frame.total === '')).toBe(true);
    expect(page.inputValue()).toBe('0');
    expect(page.error()).toBe('');
  });
});
