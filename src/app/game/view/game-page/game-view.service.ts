import { Injectable, computed, inject } from '@angular/core';
import { isPinCount } from '../../domain/bowling.rules';
import { GameStore } from '../../store/game.store';

/**
 * Orchestration for the game page: exposes the store state the screen needs,
 * builds labels and turns user intent into store calls.
 * Provided by the page component, so it lives and dies with it.
 */
@Injectable()
export class GameViewService {
  private readonly store = inject(GameStore);

  readonly frames = this.store.frames;
  readonly totalScore = this.store.totalScore;
  readonly maxPins = this.store.pinsStanding;
  readonly isGameOver = this.store.isGameOver;
  readonly canUndo = this.store.canUndo;

  readonly currentFrame = computed(() => this.store.currentPosition()?.frame ?? null);

  readonly positionLabel = computed(() => {
    const position = this.store.currentPosition();
    return position ? `Frame ${position.frame} · Roll ${position.roll}` : 'Game over';
  });

  roll(pins: number): void {
    if (isPinCount(pins)) {
      this.store.roll(pins);
    }
  }

  rollRandom(): void {
    this.roll(Math.floor(Math.random() * (this.maxPins() + 1)));
  }

  undo(): void {
    this.store.undo();
  }

  newGame(): void {
    this.store.reset();
  }
}
