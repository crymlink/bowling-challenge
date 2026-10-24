import { Injectable, computed, inject } from '@angular/core';
import { Frame, PinCount } from '../domain/bowling.models';
import { FRAME_COUNT, MAX_PINS, isPinCount } from '../domain/bowling.rules';
import { GameStore } from '../store/game.store';
import { FrameView, RollMark } from './game-view.models';
import { RANDOM } from './random.token';

const PIN_MARKS: Record<PinCount, RollMark> = {
  0: '-',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: 'X',
};

/**
 * Presentation logic for the game page: maps domain state from the store to
 * what the screen needs (notation, labels, screen reader text) and turns user
 * intent into store calls. Provided by the page component, so it lives and dies with it.
 */
@Injectable()
export class GameViewService {
  private readonly store = inject(GameStore);
  private readonly random = inject(RANDOM);

  readonly totalScore = this.store.totalScore;
  readonly maxPins = this.store.pinsStanding;
  readonly isGameOver = this.store.isGameOver;
  readonly canUndo = this.store.canUndo;

  readonly frames = computed<FrameView[]>(() => {
    const currentFrame = this.store.currentPosition()?.frame;
    return this.store.frames().map((frame) => toFrameView(frame, frame.number === currentFrame));
  });

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

function toFrameView(frame: Frame, isCurrent: boolean): FrameView {
  const marks = toMarks(frame);
  return {
    number: frame.number,
    marks,
    runningTotal: frame.runningTotal,
    isCurrent,
    description: describeFrame(frame, marks),
  };
}

/** Converts rolls to sheet notation, tracking the rack so frame 10 resets after X and /. */
function toMarks(frame: Frame): (RollMark | null)[] {
  const slots = frame.number === FRAME_COUNT ? 3 : 2;
  const marks: (RollMark | null)[] = [];
  let standing = MAX_PINS;

  for (const pins of frame.rolls) {
    marks.push(pins === standing && standing < MAX_PINS ? '/' : PIN_MARKS[pins]);
    standing -= pins;
    if (standing === 0) {
      standing = MAX_PINS;
    }
  }

  while (marks.length < slots) {
    marks.push(null);
  }
  return marks;
}

function describeFrame(frame: Frame, marks: readonly (RollMark | null)[]): string {
  if (frame.rolls.length === 0) {
    return `Frame ${frame.number}: not played yet.`;
  }
  const rolls = marks
    .filter((mark): mark is RollMark => mark !== null)
    .map(spokenMark)
    .join(', ');
  const score = frame.runningTotal === null ? 'Score pending.' : `Total ${frame.runningTotal}.`;
  return `Frame ${frame.number}: ${rolls}. ${score}`;
}

function spokenMark(mark: RollMark): string {
  switch (mark) {
    case 'X':
      return 'strike';
    case '/':
      return 'spare';
    case '-':
      return '0';
    default:
      return mark;
  }
}
