import { Component, Injector, afterNextRender, inject, viewChild } from '@angular/core';
import { GameViewService } from '../game-view.service';
import { GameControlsComponent } from '../../components/game-controls/game-controls.component';
import { RollInputComponent } from '../../components/roll-input/roll-input.component';
import { ScoreSheetComponent } from '../../components/score-sheet/score-sheet.component';

/**
 * Container for the game. Wires the presentational components to the view service
 * and manages focus, since elements get disabled as the game progresses.
 */
@Component({
  selector: 'app-game-page',
  imports: [RollInputComponent, ScoreSheetComponent, GameControlsComponent],
  providers: [GameViewService],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
  protected readonly game = inject(GameViewService);
  private readonly injector = inject(Injector);

  private readonly rollInput = viewChild.required(RollInputComponent);
  private readonly controls = viewChild.required(GameControlsComponent);

  protected roll(pins: number): void {
    this.game.roll(pins);
    this.focusNewGameIfOver();
  }

  protected rollRandom(): void {
    this.game.rollRandom();
    this.focusNewGameIfOver();
  }

  protected undo(): void {
    this.game.undo();
    this.focusAfterRender(() => this.rollInput().focus());
  }

  protected newGame(): void {
    this.game.newGame();
    this.rollInput().clear();
    this.focusAfterRender(() => this.rollInput().focus());
  }

  /** The roll controls get disabled when the game ends, so move focus to "New game". */
  private focusNewGameIfOver(): void {
    if (this.game.isGameOver()) {
      this.focusAfterRender(() => this.controls().focusNewGame());
    }
  }

  /** Disabled state is applied on render, so focus has to wait until after it. */
  private focusAfterRender(focus: () => void): void {
    afterNextRender(focus, { injector: this.injector });
  }
}
