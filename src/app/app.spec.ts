import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { GamePageComponent } from './game/view/game-page/game-page.component';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('opens the game page at the root URL', async () => {
    const harness = await RouterTestingHarness.create();

    const page = await harness.navigateByUrl('/', GamePageComponent);

    expect(page).toBeInstanceOf(GamePageComponent);
  });

  it('redirects unknown URLs to the game page', async () => {
    const harness = await RouterTestingHarness.create();

    const page = await harness.navigateByUrl('/unknown', GamePageComponent);

    expect(page).toBeInstanceOf(GamePageComponent);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
