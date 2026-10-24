import { Component, computed, inject, input } from '@angular/core';
import { Frame } from '../../domain/bowling.models';
import { FrameNotationService } from './frame-notation.service';

@Component({
  selector: 'app-frame',
  templateUrl: './frame.component.html',
  styleUrl: './frame.component.scss',
  host: {
    '[class.current]': 'current()',
  },
})
export class FrameComponent {
  private readonly notation = inject(FrameNotationService);

  readonly frame = input.required<Frame>();
  readonly current = input(false);

  protected readonly marks = computed(() => this.notation.toMarks(this.frame()));
}
