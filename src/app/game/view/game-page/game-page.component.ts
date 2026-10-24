import { Component, inject } from '@angular/core';
import { GameStore } from '../../data-access/game.store';
import { RollInputComponent } from '../../components/roll-input/roll-input.component';
import { ScoreSheetComponent } from '../../components/score-sheet/score-sheet.component';

/** Container for the game. Wires the presentational components to the store. */
@Component({
  selector: 'app-game-page',
  imports: [RollInputComponent, ScoreSheetComponent],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
  protected readonly store = inject(GameStore);
}
