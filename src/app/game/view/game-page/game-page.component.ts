import { Component, inject, viewChild } from '@angular/core';
import { GameStore } from '../../store/game.store';
import { GameViewService } from './game-view.service';
import { GameControlsComponent } from '../../components/game-controls/game-controls.component';
import { RollInputComponent } from '../../components/roll-input/roll-input.component';
import { ScoreSheetComponent } from '../../components/score-sheet/score-sheet.component';

/** Container for the game. Wires the presentational components to the store and the view service. */
@Component({
  selector: 'app-game-page',
  imports: [RollInputComponent, ScoreSheetComponent, GameControlsComponent],
  providers: [GameViewService],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
  protected readonly store = inject(GameStore);
  protected readonly game = inject(GameViewService);

  private readonly rollInput = viewChild.required(RollInputComponent);

  protected newGame(): void {
    this.game.newGame();
    this.rollInput().clear();
  }
}
