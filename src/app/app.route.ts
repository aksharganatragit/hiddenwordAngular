import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '',
    loadComponent: () =>
      import('./app/pages/home.page/home.page.component').then(
        (m) => m.HomePageComponent
      ),
  },
  {
    path: 'ad',
    loadComponent: () =>
      import('./app/pages/ad-splash.page/ad-splash.page.component').then(
        (m) => m.AdSplashPageComponent
      ),
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./app/pages/game.page/game.page.component').then(
        (m) => m.GamePageComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
