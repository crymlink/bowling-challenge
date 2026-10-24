import { Component, input } from '@angular/core';
import { Frame } from '../../domain/bowling.models';
import { FrameComponent } from '../frame/frame.component';

@Component({
  selector: 'app-score-sheet',
  imports: [FrameComponent],
  templateUrl: './score-sheet.component.html',
  styleUrl: './score-sheet.component.scss',
})
export class ScoreSheetComponent {
  readonly frames = input.required<readonly Frame[]>();
  /** Number of the frame the next roll belongs to, or `null` when the game is over. */
  readonly currentFrame = input.required<number | null>();
  readonly totalScore = input.required<number>();
}
