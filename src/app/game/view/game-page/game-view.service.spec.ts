import { TestBed } from '@angular/core/testing';
import { GameViewService } from './game-view.service';

/**
 * These tests describe what the view service adds on top of the store: filtering raw input,
 * random rolls and labels. Undo and new game are plain delegation and are covered by the
 * game page tests. `game()` is the only place that knows how the service is provided and fed.
 */
function game(...rolls: number[]) {
  TestBed.configureTestingModule({ providers: [GameViewService] });
  const view = TestBed.inject(GameViewService);
  rolls.forEach((pins) => view.roll(pins));
  return view;
}

function rollsOf(view: GameViewService): number[] {
  return view.frames().flatMap((frame) => frame.rolls);
}

describe('GameViewService', () => {
  describe('rolling', () => {
    it('passes valid pin counts on to the game', () => {
      const view = game(7, 2);

      expect(rollsOf(view)).toEqual([7, 2]);
    });

    it.each([2.5, Number.NaN, 11, -1])('ignores %d as a pin count', (pins) => {
      const view = game(pins);

      expect(rollsOf(view)).toEqual([]);
    });
  });

  describe('random roll', () => {
    it('can knock down no pins', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const view = game();
      view.rollRandom();

      expect(rollsOf(view)).toEqual([0]);
    });

    it('can knock down all pins still standing, but never more', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999);
      const view = game(7);
      view.rollRandom();

      expect(rollsOf(view)).toEqual([7, 3]);
    });

    it('does nothing once the game is over', () => {
      const view = game(...Array.from({ length: 20 }, () => 0));
      view.rollRandom();

      expect(rollsOf(view)).toHaveLength(20);
    });
  });

  describe('position', () => {
    it('labels the frame and roll of the next throw', () => {
      const view = game(3);

      expect(view.positionLabel()).toBe('Frame 1 · Roll 2');
      expect(view.currentFrame()).toBe(1);
      expect(view.maxPins()).toBe(7);
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
