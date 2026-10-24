import { Component, input } from '@angular/core';
import { FrameView } from '../../view/game-view.models';

@Component({
  selector: 'app-score-sheet',
  templateUrl: './score-sheet.component.html',
  styleUrl: './score-sheet.component.scss',
})
export class ScoreSheetComponent {
  readonly frames = input.required<readonly FrameView[]>();
  readonly totalScore = input.required<number>();
}
