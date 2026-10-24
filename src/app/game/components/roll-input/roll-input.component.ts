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
import { RollPosition } from '../../domain/bowling.models';

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
  readonly pinsStanding = input.required<number>();

  readonly roll = output<number>();
  readonly randomRoll = output<void>();

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
          this.roll.emit(field.pins().value());
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
