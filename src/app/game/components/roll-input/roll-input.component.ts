import {
  Component,
  ElementRef,
  computed,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  disabled,
  form,
  max,
  min,
  required,
  validate,
} from '@angular/forms/signals';
import { PinCount, RollPosition } from '../../domain/bowling.models';
import { isPinCount } from '../../domain/bowling.rules';

interface RollFormModel {
  pins: number;
}

const initialModel: RollFormModel = { pins: 0 };

@Component({
  selector: 'app-roll-input',
  imports: [FormField, FormRoot],
  templateUrl: './roll-input.component.html',
  styleUrl: './roll-input.component.scss',
})
export class RollInputComponent {
  /** Where the next roll will be played, or `null` when the game is over. */
  readonly position = input.required<RollPosition | null>();
  readonly pinsStanding = input.required<PinCount>();

  /** A typed or random roll, always a possible pin count. */
  readonly roll = output<PinCount>();

  private readonly pinsInput = viewChild.required<ElementRef<HTMLInputElement>>('pinsInput');

  protected readonly gameOver = computed(() => this.position() === null);

  /** Starts over whenever the game moves on, so a value typed for an earlier roll never lingers. */
  private readonly model = linkedSignal<RollPosition | null, RollFormModel>({
    source: this.position,
    computation: () => ({ ...initialModel }),
  });

  protected readonly rollForm = form(
    this.model,
    (path) => {
      disabled(path.pins, { when: () => this.gameOver() });
      required(path.pins, { message: 'Enter the number of pins.' });
      validate(path.pins, ({ value }) =>
        Number.isInteger(value())
          ? undefined
          : { kind: 'integer', message: 'Enter a whole number.' },
      );
      min(path.pins, 0, { message: 'The number of pins cannot be negative.' });
      max(path.pins, () => this.pinsStanding(), {
        message: () => `Only ${this.pinsStanding()} pins are standing.`,
      });
    },
    {
      submission: {
        action: async (field) => {
          this.emitRoll(field.pins().value());
          this.clear();
          this.focus();
        },
      },
    },
  );

  /** Only shown once the user has interacted with the field, to avoid premature errors. */
  protected readonly errorMessage = computed(() => {
    const pins = this.rollForm.pins();
    return pins.touched() || pins.dirty() ? (pins.errors()[0]?.message ?? '') : '';
  });

  /** Knocks down a random number of the standing pins, from none to all of them. */
  protected rollRandom(): void {
    this.emitRoll(Math.floor(Math.random() * (this.pinsStanding() + 1)));
  }

  /** The form already rejects anything else; this narrows the number to a `PinCount`. */
  private emitRoll(pins: number): void {
    if (isPinCount(pins)) {
      this.roll.emit(pins);
    }
  }

  /** Resets the value and the touched/dirty state, so no stale error is shown. */
  private clear(): void {
    this.rollForm().reset({ ...initialModel });
  }

  /** Focuses the input and selects its content so the next number replaces it. */
  private focus(): void {
    const element = this.pinsInput().nativeElement;
    element.focus();
    element.select();
  }
}
