import { InjectionToken } from '@angular/core';

/** Source of random numbers in [0, 1). Injectable so random rolls can be made deterministic. */
export const RANDOM = new InjectionToken<() => number>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});
