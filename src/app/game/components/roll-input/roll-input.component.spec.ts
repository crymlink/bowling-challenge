import { TestBed } from '@angular/core/testing';
import { PinCount, RollPosition } from '../../domain/bowling.models';
import { RollInputComponent } from './roll-input.component';

/**
 * These tests use the roll input the way a player does: typing, clicking and reading.
 * `render()` is the only place that knows the component's inputs, outputs and markup.
 */
interface Inputs {
  position?: RollPosition | null;
  pinsStanding?: PinCount;
}

async function render({ position = { frame: 1, roll: 1 }, pinsStanding = 10 }: Inputs = {}) {
  const fixture = TestBed.createComponent(RollInputComponent);
  fixture.componentRef.setInput('position', position);
  fixture.componentRef.setInput('pinsStanding', pinsStanding);

  const rolled: PinCount[] = [];
  fixture.componentInstance.roll.subscribe((pins) => rolled.push(pins));
  await fixture.whenStable();

  const element: HTMLElement = fixture.nativeElement;
  const input = element.querySelector('input')!;
  const rollButton = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const randomButton = element.querySelector<HTMLButtonElement>('button[type="button"]')!;

  return {
    rolled,
    input,
    rollButton,
    randomButton,
    async type(value: string) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    },
    async click(button: HTMLButtonElement) {
      button.click();
      await fixture.whenStable();
    },
    async update(inputs: Inputs) {
      Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
      await fixture.whenStable();
    },
    hint: () => element.querySelector('.hint')?.textContent?.trim(),
    error: () => element.querySelector('.error')?.textContent?.trim() ?? '',
  };
}

describe('RollInputComponent', () => {
  it('rolls the typed number of pins and clears the field', async () => {
    const view = await render();
    await view.type('7');
    await view.click(view.rollButton);

    expect(view.rolled).toEqual([7]);
    expect(view.input.value).toBe('0');
    expect(view.error()).toBe('');
  });

  it('tells the player how many pins can be knocked down', async () => {
    const view = await render({ pinsStanding: 3 });

    expect(view.hint()).toBe('Enter a number from 0 to 3.');
  });

  it('shows no error before the player types', async () => {
    const view = await render();

    expect(view.error()).toBe('');
  });

  describe('validation', () => {
    it.each([
      { name: 'more pins than are standing', value: '4', message: 'Only 3 pins are standing.' },
      { name: 'a negative number', value: '-1', message: 'The number of pins cannot be negative.' },
      { name: 'a decimal number', value: '2.5', message: 'Enter a whole number.' },
      { name: 'an empty field', value: '', message: 'Enter the number of pins.' },
    ])('rejects $name', async ({ value, message }) => {
      const view = await render({ pinsStanding: 3 });
      await view.type(value);

      expect(view.error()).toBe(message);
      expect(view.rollButton.disabled).toBe(true);
    });

    it('follows the pins still standing', async () => {
      const view = await render({ pinsStanding: 10 });
      await view.type('8');
      expect(view.error()).toBe('');

      await view.update({ pinsStanding: 3 });

      expect(view.error()).toBe('Only 3 pins are standing.');
    });
  });

  describe('random roll', () => {
    it('can knock down no pins', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const view = await render();
      await view.click(view.randomButton);

      expect(view.rolled).toEqual([0]);
    });

    it('can knock down all pins still standing, but never more', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);
      const view = await render({ pinsStanding: 3 });
      await view.click(view.randomButton);

      expect(view.rolled).toEqual([3]);
    });
  });

  it('locks the input once the game is over', async () => {
    const view = await render({ position: null });

    expect(view.input.disabled).toBe(true);
    expect(view.rollButton.disabled).toBe(true);
    expect(view.randomButton.disabled).toBe(true);
    expect(view.hint()).toBe('The game is over. Start a new game to keep playing.');
  });

  it('starts over when the game moves on to another roll', async () => {
    const view = await render({ pinsStanding: 3 });
    await view.type('8');
    await view.update({ position: { frame: 1, roll: 2 } });

    expect(view.input.value).toBe('0');
    expect(view.error()).toBe('');
  });
});
