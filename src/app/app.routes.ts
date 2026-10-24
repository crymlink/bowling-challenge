import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Bowling Score',
    loadComponent: () =>
      import('./game/view/game-page/game-page.component').then((m) => m.GamePageComponent),
  },
  { path: '**', redirectTo: '' },
];
