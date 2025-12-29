import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-article-detail-page',
  imports: [CommonModule],
  templateUrl: './article-detail.page.component.html',
  styleUrls: ['./article-detail.page.component.scss'],
})
export class ArticleDetailPageComponent {
  article: any;

  private articles: Record<string, any> = {
    'best-hidden-word-strategies': {
      title: 'Best Hidden Word Strategies',
      publishedAt: 'Jan 5, 2025',
      content: `
        <p>Hidden Word puzzles reward patience and pattern recognition.</p>
        <h2>Start With Longer Words</h2>
        <p>Longer words reduce visual clutter and narrow your search.</p>
        <h2>Scan Diagonally</h2>
        <p>Many words hide diagonally—don’t just scan horizontally.</p>
      `,
    },
    'how-to-spot-words-faster': {
      title: 'How to Spot Words Faster',
      publishedAt: 'Jan 8, 2025',
      content: `
        <p>Speed comes from practice and visual chunking.</p>
        <h2>Recognize Prefixes</h2>
        <p>Spotting common prefixes accelerates recognition.</p>
      `,
    },
  };

  constructor(
    private route: ActivatedRoute,
    title: Title,
    meta: Meta
  ) {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.article = this.articles[slug];

    if (this.article) {
      title.setTitle(`${this.article.title} | Hidden Word`);
      meta.updateTag({
        name: 'description',
        content: this.article.title,
      });
    }
  }
}
