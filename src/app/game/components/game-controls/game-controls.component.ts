import { Component, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-game-controls',
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.scss',
})
export class GameControlsComponent {
  readonly canUndo = input.required<boolean>();
  readonly gameOver = input.required<boolean>();

  readonly undo = output<void>();
  readonly newGame = output<void>();

  private readonly newGameButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('newGameButton');

  focusNewGame(): void {
    this.newGameButton().nativeElement.focus();
  }
}
