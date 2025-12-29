import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./app/pages/home.page/home.page.component')
            .then(m => m.HomePageComponent),
      },
      {
        path: 'ad',
        loadComponent: () =>
          import('./app/pages/ad-splash.page/ad-splash.page.component')
            .then(m => m.AdSplashPageComponent),
      },
      {
        path: 'help',
        loadComponent: () =>
          import('./app/pages/help.page/help.page.component')
            .then(m => m.HelpPageComponent),
      },

      // Articles
      {
  path: 'articles',
  loadComponent: () =>
    import('./app/pages/articles/articles.page/articles.page.component')
      .then(m => m.ArticlesPageComponent),
},
{
  path: 'articles/:slug',
  loadComponent: () =>
    import('./app/pages/article-detail/article-detail.page/article-detail.page.component')
      .then(m => m.ArticleDetailPageComponent),
},

      // Legal pages
      { path: 'privacy-policy', loadComponent: () => import('./app/pages/legal/privacy.page/privacy.page.component').then(m => m.PrivacyPageComponent) },
      { path: 'terms-of-service', loadComponent: () => import('./app/pages/legal/tos.page/tos.page.component').then(m => m.TosPageComponent) },
      { path: 'cookie-policy', loadComponent: () => import('./app/pages/legal/cookie.page/cookie.page.component').then(m => m.CookiePageComponent) },
      { path: 'terms-of-sale', loadComponent: () => import('./app/pages/legal/sale.page/sale.page.component').then(m => m.SalePageComponent) },
      { path: 'sitemap', loadComponent: () => import('./app/pages/sitemap/sitemap.page/sitemap.page.component').then(m => m.SitemapPageComponent) },
    ],
  },

  // 🚫 NO FOOTER HERE
  {
    path: 'game',
    loadComponent: () =>
      import('./layouts/game-layout/game-layout.component')
        .then(m => m.GameLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./app/pages/game.page/game.page.component')
            .then(m => m.GamePageComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
