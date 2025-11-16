import { Component, HostListener, OnInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import { HelpModalComponent } from '../../shared/help-modal/help-modal.component';
import { EndModalComponent } from '../../shared/end-modal/end-modal.component';

import { WORD_LIST ,VALID_WORDS} from '../game.page/words';

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
  imports: [NgIf, NgFor, CommonModule, HelpModalComponent, EndModalComponent],
  templateUrl: './game.page.component.html',
  styleUrls: ['./game.page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GamePageComponent implements OnInit {
  cols = 5;
  rowsCount = 7;

  /** 🟩 DYNAMIC SECRET WORD */
  secret = this.getDailyWord();

  rows: Row[] = [];
  currentRow = 0;
  currentCol = 0;

  showHelp = false;
  showEndModal = false;
  errorMessage = "";

  constructor(private router: Router) {
    this.initGrid();
  }

  /** 🟦 ON INIT - RESTORE BOARD & CHECK MODAL */
  ngOnInit() {
    this.restoreBoard();

    const lastPlayed = localStorage.getItem('last_played');
    if (lastPlayed === new Date().toDateString()) {
      this.showEndModal = true;
    }

    /** ⏳ AUTO RESET IF MIDNIGHT PASSED WHILE TAB IS OPEN */
    setInterval(() => {
      if (localStorage.getItem("last_played") !== new Date().toDateString()) {
        localStorage.removeItem("board_state");
        localStorage.removeItem("daily_word");
        location.reload();
      }
    }, 60000); // check every 1 minute
  }

  /** 🎯 RESTORE PREVIOUS BOARD */
  restoreBoard() {
    const storedBoard = localStorage.getItem("board_state");
    if (!storedBoard) return;

    const grid = JSON.parse(storedBoard);

    grid.forEach((row: any, ri: number) =>
      row.forEach((cell: any, ci: number) => {
        this.rows[ri].cells[ci].letter = cell.letter;
        this.rows[ri].cells[ci].state = cell.state;
      })
    );

    this.currentRow = grid.findIndex((r: any) => r.some((c: any) => c.letter === ""));
    if (this.currentRow === -1) this.currentRow = this.rowsCount - 1;
  }

  /** ⏰ MIDNIGHT COUNTDOWN */
  getCountdown() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /** 🧠 GENERATE TODAY'S WORD */
  getDailyWord(): string {
    const todayKey = new Date().toDateString();
    const stored = localStorage.getItem("daily_word");

    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === todayKey) return data.word;
    }

    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

    localStorage.setItem("daily_word", JSON.stringify({
      date: todayKey,
      word
    }));

    return word;
  }

  /** HELP MODAL **/
  openHelp() { this.showHelp = true; }
  closeHelp() { this.showHelp = false; }

  /** 🏆 LEADERBOARD BUTTON TRIGGERS END MODAL */
  openEndModal() { this.showEndModal = true; }

  /** VIRTUAL KEYBOARD */
  keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ];

  /** CREATE EMPTY GRID */
  initGrid() {
    this.rows = Array.from({ length: this.rowsCount }, () => ({
      cells: Array.from({ length: this.cols }, () => ({
        letter: '',
        state: '' as CellState,
      })),
    }));
  }

  /** KEY ENTRY */
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

  /** SUBMIT GUESS */
  submitGuess() {
  if (this.currentCol < this.cols) return;

  const guess = this.rows[this.currentRow].cells
    .map((c) => c.letter)
    .join("");

  /** ❗ VALIDATION: MUST be a real English word */
  if (!VALID_WORDS.includes(guess)) {
    this.errorMessage = "❗ Not a valid English word";
    setTimeout(() => (this.errorMessage = ""), 2000);
    return;  // ⛔ STOP HERE → DO NOT ADVANCE ROW
  }

  /** 🟩 VALID WORD → Evaluate */
  this.evaluateGuess(guess);
  this.saveBoardState();

  /** Move to next row ONLY if valid */
  if (this.currentRow < this.rowsCount - 1) {
    this.currentRow++;
    this.currentCol = 0;
  }
}

  /** 🧠 WORD CHECKER */
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
      if (st !== 'absent') matchCount++;
    });

    this.rows[this.currentRow].score = matchCount;

    if (matchCount === 5) {
      this.updateStats(true);
      this.lockDay();
      this.showEndModal = true;
      return;
    }

    if (this.currentRow === this.rowsCount - 1) {
      this.updateStats(false);
      this.lockDay();
      this.showEndModal = true;
    }
  }

  /** SAVE BOARD STATE */
  saveBoardState() {
    const board = this.rows.map(r =>
      r.cells.map(c => ({ letter: c.letter, state: c.state }))
    );
    localStorage.setItem("board_state", JSON.stringify(board));
  }

  /** LISTEN TO KEYBOARD */
@HostListener('window:keydown', ['$event'])
handleKeyPress(event: KeyboardEvent) {
  event.preventDefault();   // ⭐ IMPORTANT
  const key = event.key.toUpperCase();
  if (key === 'ENTER') this.onKey('Enter');
  else if (key === 'BACKSPACE') this.onKey('Backspace');
  else if (/^[A-Z]$/.test(key)) this.onKey(key);
   if (event.key === "`") {   // backtick key
    alert("SECRET WORD = " + this.secret);
    return;
  }
}

  /** 📊 STATS UPDATE */
  updateStats(win: boolean) {
    let stats = JSON.parse(localStorage.getItem('game_stats') || '{}');

    stats.played = (stats.played || 0) + 1;

    if (win) {
      stats.wins = (stats.wins || 0) + 1;
      stats.streak = (stats.streak || 0) + 1;
      stats.maxStreak = Math.max(stats.streak, stats.maxStreak || 0);
    } else {
      stats.streak = 0;
    }

    stats.winPercent = Math.round((stats.wins || 0) / stats.played * 100);
    stats.countdown = this.getCountdown();

    localStorage.setItem('game_stats', JSON.stringify(stats));
  }

  /** 🗓 LOCK GAME FOR TODAY */
  lockDay() {
    localStorage.setItem('last_played', new Date().toDateString());
  }
}
