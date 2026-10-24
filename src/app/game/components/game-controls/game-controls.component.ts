import { Component, input, output } from '@angular/core';

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
}
