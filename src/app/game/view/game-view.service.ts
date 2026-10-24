import { Injectable, computed, inject } from '@angular/core';
import { isPinCount } from '../domain/bowling.rules';
import { GameStore } from '../store/game.store';
import { RANDOM } from './random.token';

/**
 * Orchestration for the game page: exposes the store state the screen needs,
 * builds labels and screen reader text, and turns user intent into store calls.
 * Provided by the page component, so it lives and dies with it.
 */
@Injectable()
export class GameViewService {
  private readonly store = inject(GameStore);
  private readonly random = inject(RANDOM);

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

  /** Text for the polite live region, so screen reader users hear the effect of each action. */
  readonly announcement = computed(() => {
    const position = this.store.currentPosition();
    if (!position) {
      return `Game over. Final score ${this.totalScore()}.`;
    }
    return (
      `Frame ${position.frame}, roll ${position.roll}. ` +
      `${this.maxPins()} pins standing. Total score ${this.totalScore()}.`
    );
  });

  roll(pins: number): void {
    if (isPinCount(pins)) {
      this.store.roll(pins);
    }
  }

  rollRandom(): void {
    this.roll(Math.floor(this.random() * (this.maxPins() + 1)));
  }

  undo(): void {
    this.store.undo();
  }

  newGame(): void {
    this.store.reset();
  }
}
