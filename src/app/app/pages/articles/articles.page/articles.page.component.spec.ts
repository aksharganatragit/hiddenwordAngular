import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Article {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
}

@Component({
  standalone: true,
  selector: 'app-articles-page',
  imports: [CommonModule, RouterModule], // ✅ REQUIRED
  templateUrl: './articles.page.component.html',
  styleUrls: ['./articles.page.component.scss'],
})
export class ArticlesPageComponent {
  articles: Article[] = [
    {
      title: 'Best Hidden Word Strategies',
      slug: 'best-hidden-word-strategies',
      excerpt: 'Learn proven strategies to solve hidden word puzzles faster.',
      publishedAt: 'Jan 5, 2025',
    },
  ];
}
