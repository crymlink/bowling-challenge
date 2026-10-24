import { Injectable, computed, inject } from '@angular/core';
import { isPinCount } from '../../domain/bowling.rules';
import { GameStore } from '../../data-access/game.store';

/**
 * Orchestration for the game page: builds labels from the store state and turns
 * user intent into store calls. The page reads plain store state directly.
 * Provided by the page component, so it lives and dies with it.
 */
@Injectable()
export class GameViewService {
  private readonly store = inject(GameStore);

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
    this.roll(Math.floor(Math.random() * (this.store.pinsStanding() + 1)));
  }

  newGame(): void {
    this.store.reset();
  }
}
