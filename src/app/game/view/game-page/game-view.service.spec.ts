import { TestBed } from '@angular/core/testing';
import { GameStore } from '../../data-access/game.store';
import { GameViewService } from './game-view.service';

/**
 * These tests describe what the view service adds on top of the store: filtering raw input,
 * random rolls and labels. New game is plain delegation and is covered by the game page tests.
 * `game()` is the only place that knows how the service is provided and fed, `rolls()` how
 * the result is read.
 */
function game(...rolls: number[]) {
  TestBed.configureTestingModule({ providers: [GameViewService] });
  const view = TestBed.inject(GameViewService);
  rolls.forEach((pins) => view.roll(pins));
  return view;
}

function rolls(): readonly number[] {
  return TestBed.inject(GameStore).rolls();
}

describe('GameViewService', () => {
  describe('rolling', () => {
    it('passes valid pin counts on to the game', () => {
      game(7, 2);

      expect(rolls()).toEqual([7, 2]);
    });

    it.each([2.5, Number.NaN, 11, -1])('ignores %d as a pin count', (pins) => {
      game(pins);

      expect(rolls()).toEqual([]);
    });
  });

  describe('random roll', () => {
    it('can knock down no pins', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const view = game();
      view.rollRandom();

      expect(rolls()).toEqual([0]);
    });

    it('can knock down all pins still standing, but never more', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);
      const view = game(7);
      view.rollRandom();

      expect(rolls()).toEqual([7, 3]);
    });

    it('does nothing once the game is over', () => {
      const view = game(...Array.from({ length: 20 }, () => 0));
      view.rollRandom();

      expect(rolls()).toHaveLength(20);
    });
  });

  describe('position', () => {
    it('labels the frame and roll of the next throw', () => {
      const view = game(3);

      expect(view.positionLabel()).toBe('Frame 1 · Roll 2');
      expect(view.currentFrame()).toBe(1);
    });

    it('moves to the next frame after a strike', () => {
      const view = game(10);

      expect(view.positionLabel()).toBe('Frame 2 · Roll 1');
      expect(view.currentFrame()).toBe(2);
    });

    it('shows game over without a current frame', () => {
      const view = game(...Array.from({ length: 12 }, () => 10));

      expect(view.positionLabel()).toBe('Game over');
      expect(view.currentFrame()).toBeNull();
    });
  });
});
