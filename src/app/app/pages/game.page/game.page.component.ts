import { Component, HostListener } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';

type CellState = 'correct' | 'present' | 'absent' | '';

interface Cell {
  letter: string;
  state: CellState;
}

interface Row {
  cells: Cell[];
  score?: number;
}

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './game.page.component.html',
  styleUrls: ['./game.page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GamePageComponent {
  cols = 5;
  rowsCount = 7;
  secret = 'SUGAR';
  rows: Row[] = [];
  currentRow = 0;
  currentCol = 0;

  keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Ent','Z','X','C','V','B','N','M','Backspace']
  ];

  constructor() {
    this.initGrid();
  }

  initGrid() {
    this.rows = Array.from({ length: this.rowsCount }, () => ({
      cells: Array.from({ length: this.cols }, () => ({
        letter: '',
        state: '' as CellState,
      })),
    }));
  }

  getEmojiForScore(score: number): string {
    return ['😭', '😢', '😐', '🙂', '😄', '🎉'][score] || '';
  }

  onKey(key: string) {
    if (key === 'Enter') return this.submitGuess();
    if (key === 'Backspace') return this.deleteLetter();

    if (/^[A-Z]$/.test(key) && this.currentCol < this.cols) {
      this.rows[this.currentRow].cells[this.currentCol].letter = key;
      this.currentCol++;
    }
  }

  deleteLetter() {
    if (this.currentCol > 0) {
      this.currentCol--;
      this.rows[this.currentRow].cells[this.currentCol].letter = '';
    }
  }

  submitGuess() {
    if (this.currentCol < this.cols) return;
    const guess = this.rows[this.currentRow].cells.map(c => c.letter).join('');
    this.evaluateGuess(guess);
    if (this.currentRow < this.rowsCount - 1) {
      this.currentRow++;
      this.currentCol = 0;
    }
  }

  evaluateGuess(guess: string) {
    const secretArr = this.secret.split('');
    const guessArr = guess.split('');
    const states: CellState[] = Array(this.cols).fill('absent');

    guessArr.forEach((l, i) => {
      if (secretArr[i] === l) {
        states[i] = 'correct';
        secretArr[i] = '_';
      }
    });

    guessArr.forEach((l, i) => {
      if (states[i] === 'absent' && secretArr.includes(l)) {
        states[i] = 'present';
        secretArr[secretArr.indexOf(l)] = '_';
      }
    });

    let matchCount = 0;
    states.forEach((st, i) => {
      this.rows[this.currentRow].cells[i].state = st;
      if (st === 'correct' || st === 'present') matchCount++;
    });

    this.rows[this.currentRow].score = matchCount;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    const key = event.key.toUpperCase();
    if (key === 'ENTER') this.onKey('Enter');
    else if (key === 'BACKSPACE') this.onKey('Backspace');
    else if (/^[A-Z]$/.test(key)) this.onKey(key);
  }

  openSettings() {}
  openHelp() {}
}
