import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-game-controls',
  templateUrl: './game-controls.component.html',
  styleUrl: './game-controls.component.scss',
})
export class GameControlsComponent {
  readonly gameOver = input.required<boolean>();

  readonly newGame = output<void>();
}
