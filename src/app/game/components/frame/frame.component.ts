import { Component, computed, input } from '@angular/core';
import { Frame } from '../../domain/bowling.models';
import { toMarks } from './frame-notation';

@Component({
  selector: 'app-frame',
  templateUrl: './frame.component.html',
  styleUrl: './frame.component.scss',
})
export class FrameComponent {
  readonly frame = input.required<Frame>();

  protected readonly marks = computed(() => toMarks(this.frame()));
}
