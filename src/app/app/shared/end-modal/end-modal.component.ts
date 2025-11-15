import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';

@Component({
  selector: 'app-end-modal',
  standalone: true,
  imports: [NgIf, CommonModule],
  templateUrl: './end-modal.component.html',
  styleUrls: ['./end-modal.component.scss'],
})
export class EndModalComponent {
  @Output() close = new EventEmitter<void>();

  stats: any = {};
  countdownText: string = '';

  constructor() {
    this.loadStats();
    this.startCountdown();
  }

  /** 📊 LOAD PLAYER STATS **/
  loadStats() {
    this.stats = JSON.parse(localStorage.getItem('game_stats') || '{}');

    // Ensure defaults exist
    this.stats.played = this.stats.played ?? 0;
    this.stats.wins = this.stats.wins ?? 0;
    this.stats.winPercent = this.stats.winPercent ?? 0;
    this.stats.streak = this.stats.streak ?? 0;
    this.stats.maxStreak = this.stats.maxStreak ?? 0;
  }

  /** 🕛 LIVE COUNTDOWN (updates every second) **/
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

  /** ❌ CLOSE MODAL **/
  closeModal() {
    this.close.emit();
  }
}
