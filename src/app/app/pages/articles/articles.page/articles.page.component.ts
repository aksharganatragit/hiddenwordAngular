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
  imports: [CommonModule, RouterModule],
  templateUrl: './articles.page.component.html',
  styleUrls: ['./articles.page.component.scss'],
})
export class ArticlesPageComponent {
  articles: Article[] = [
    {
      title: 'Best Hidden Word Strategies',
      slug: 'best-hidden-word-strategies',
      excerpt: 'Proven techniques to solve hidden word puzzles faster and smarter.',
      publishedAt: 'Jan 5, 2025',
    },
    {
      title: 'How to Spot Words Faster',
      slug: 'how-to-spot-words-faster',
      excerpt: 'Train your eyes to recognize patterns and word fragments quickly.',
      publishedAt: 'Jan 8, 2025',
    },
    {
      title: 'Beginner Mistakes to Avoid',
      slug: 'beginner-mistakes-to-avoid',
      excerpt: 'Common traps new players fall into and how to avoid them.',
      publishedAt: 'Jan 12, 2025',
    },
    {
      title: 'Daily Hidden Word Routine',
      slug: 'daily-hidden-word-routine',
      excerpt: 'A simple daily routine to consistently improve your score.',
      publishedAt: 'Jan 18, 2025',
    },
    {
      title: 'Advanced Pattern Recognition',
      slug: 'advanced-pattern-recognition',
      excerpt: 'Level up by recognizing diagonal and overlapping word patterns.',
      publishedAt: 'Jan 22, 2025',
    },
    {
      title: 'Why Word Games Improve Your Brain',
      slug: 'why-word-games-improve-your-brain',
      excerpt: 'The cognitive benefits of playing word games every day.',
      publishedAt: 'Jan 26, 2025',
    },{
      title: 'Why Word Games Improve Your Brain',
      slug: 'why-word-games-improve-your-brain',
      excerpt: 'The cognitive benefits of playing word games every day.',
      publishedAt: 'Jan 26, 2025',
    }
  ];
}
