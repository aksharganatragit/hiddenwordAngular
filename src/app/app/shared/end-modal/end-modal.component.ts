import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';

@Component({
  selector: 'app-end-modal',
  standalone: true,
  imports: [NgIf, CommonModule],
  templateUrl: './end-modal.component.html',
  styleUrls: ['./end-modal.component.scss'],
})
export class EndModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  @Input() didWin: boolean = true;
  @Input() secretWord: string = '';
  @Input() gameCompleted: boolean = false;
  @Input() rows: any[] = []; // ✅ REQUIRED for sharing!
  @Input() score: number = 0; // 🆕 SCORE INPUT

  stats: any = {};
  countdownText: string = '';

  ngOnInit() {
    this.loadStats();
    this.startCountdown();
  }

  /** 📊 LOAD PLAYER STATS **/
  loadStats() {
    this.stats = JSON.parse(localStorage.getItem('game_stats') || '{}');

    this.stats.played ??= 0;
    this.stats.wins ??= 0;
    this.stats.winPercent ??= 0;
    this.stats.streak ??= 0;
    this.stats.maxStreak ??= 0;
  }

  /** 🕛 COUNTDOWN **/
  startCountdown() {
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);
  }

  updateCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    this.countdownText =
      `${h.toString().padStart(2, '0')}:` +
      `${m.toString().padStart(2, '0')}:` +
      `${s.toString().padStart(2, '0')}`;
  }

  /** ❌ CLOSE **/
  closeModal() {
    this.close.emit();
  }

  /** 📋 COPY RESULT TO CLIPBOARD DIRECTLY **/
  copyResultToClipboard() {
    const shareText = this.generateShareText();
    if (shareText) {
      this.copyToClipboard(shareText);
    }
  }

  /** 🔗 SHARE RESULT (with Score and Stats) **/
  shareResult() {
    const shareText = this.generateShareText();
    if (!shareText) return;

    // Try to use the modern share API first, fallback to clipboard
    if (navigator.share) {
      navigator.share({
        title: 'Hidden Word',
        text: shareText
      }).catch(() => {
        // If share fails, copy to clipboard
        this.copyToClipboard(shareText);
      });
    } else {
      // Fallback to clipboard
      this.copyToClipboard(shareText);
    }
  }

  /** 🆕 GENERATE SHARE TEXT (reusable method) **/
  generateShareText(): string | null {
    const domain = 'https://hiddenword.co';

    // Check if game was completed
    if (!this.gameCompleted) {
      alert('Complete the game first to share your result!');
      return null;
    }

    // Filter rows that have at least one filled cell
    const filledRows = this.rows.filter(r => 
      r.cells.some((c: any) => c.letter !== '')
    );

    if (filledRows.length === 0) {
      alert('Nothing to share yet!');
      return null;
    }

    // Generate emoji grid based on cell states
    const emojiGrid = filledRows.map(r => {
      return r.cells.map((c: any) => {
        if (c.state === 'correct') return '🟩';
        if (c.state === 'present') return '🟨';
        if (c.state === 'absent') return '⬛';
        return '⬜'; // Empty cell
      }).join('');
    }).join('\n');

    const resultTitle = this.didWin ? '✅ WIN' : '❌ LOSS';
    const attempts = filledRows.length;

    // Include score and all statistics in share text
    return `Hidden Word ${resultTitle}\n` +
      `Attempts: ${attempts}/6\n` +
      `${emojiGrid}\n\n` +
      `📊 Statistics:\n` +
      `Played: ${this.stats.played} | Wins: ${this.stats.wins}\n` +
      `Win %: ${this.stats.winPercent}% | Streak: ${this.stats.streak} 🔥\n` +
      `Max Streak: ${this.stats.maxStreak}\n\n` +
      `Play: ${domain}`;
  }

  /** 📋 Copy to clipboard helper **/
  copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('✅ Result copied to clipboard!\n\nPaste it anywhere to share your score!');
      }).catch(() => {
        // Fallback for older browsers
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  /** 📋 Fallback copy method for older browsers **/
  fallbackCopy(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('✅ Result copied to clipboard!');
    } catch (err) {
      alert('❌ Could not copy. Please try again.');
    }
    
    document.body.removeChild(textArea);
  }
}