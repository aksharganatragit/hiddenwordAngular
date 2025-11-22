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
  gameOver = false;
  didWin = false; // 🆕 ADD THISs
  gameCompleted = false; // 🆕 ADD THIS - Track if game was actually finished

  constructor(private router: Router) {
    this.initGrid();
  }

  /** 🟦 ON INIT - RESTORE BOARD & CHECK MODAL */
ngOnInit() {
  // ✅ CHECK IF NEW DAY - Clear old data if word changed
  const storedDailyWord = localStorage.getItem("daily_word");
  const currentDate = new Date().toDateString();
  
  if (storedDailyWord) {
    const dailyWordData = JSON.parse(storedDailyWord);
    
    // 🔄 If it's a new day, clear everything
    if (dailyWordData.date !== currentDate) {
      localStorage.removeItem("board_state");
      localStorage.removeItem("last_played");
      localStorage.removeItem("daily_word");
      this.secret = this.getDailyWord(); // Generate new word
      this.initGrid(); // Reset grid
      this.gameOver = false; // 🆕 Reset game over state
        this.didWin = false; // 🆕 Reset win state
           this.gameCompleted = false; // 🆕 Reset completed state
    }
  }

  // Restore board only if it's the same day
  this.restoreBoard();
  // 🆕 Load win state from stats
  const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
  if (stats.didWin !== undefined) {
    this.didWin = stats.didWin;
  }
   if (stats.gameCompleted !== undefined) {
    this.gameCompleted = stats.gameCompleted; // 🆕 Restore completion status
  }
  
  // Check if already played today
  const lastPlayed = localStorage.getItem('last_played');
  if (lastPlayed === currentDate) {
    this.showEndModal = true;
    this.gameOver = true; // 🆕 Game is over if already played today
  }
   const hasSeenHelp = localStorage.getItem('has_seen_help');
  if (!hasSeenHelp) {
    this.showHelp = true;
  }

  /** ⏳ AUTO RESET IF MIDNIGHT PASSED WHILE TAB IS OPEN */
  setInterval(() => {
    const now = new Date().toDateString();
    const stored = localStorage.getItem("daily_word");
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date !== now) {
        localStorage.removeItem("board_state");
        localStorage.removeItem("daily_word");
        localStorage.removeItem("last_played");
        location.reload();
      }
    }
  }, 60000); // check every 1 minute
}
  /** 🎯 RESTORE PREVIOUS BOARD */
 restoreBoard() {
  const storedBoard = localStorage.getItem("board_state");
  if (!storedBoard) return;

  // Double-check we're on the same day
  const storedWord = localStorage.getItem("daily_word");
  if (storedWord) {
    const wordData = JSON.parse(storedWord);
    if (wordData.date !== new Date().toDateString()) {
      // Different day - don't restore
      return;
    }
  }

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
/** 🧠 GENERATE TODAY'S WORD */
getDailyWord(): string {
  const todayKey = new Date().toDateString();
  const stored = localStorage.getItem("daily_word");

  if (stored) {
    const data = JSON.parse(stored);
    if (data.date === todayKey) return data.word;
  }

  // 🎯 DATE-BASED INDEX - Same word for everyone on same day!
  const epoch = new Date('2024-01-01'); // Your game start date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysSinceEpoch = Math.floor((today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const wordIndex = daysSinceEpoch % WORD_LIST.length;
  
  const word = WORD_LIST[wordIndex];

  localStorage.setItem("daily_word", JSON.stringify({
    date: todayKey,
    word
  }));

  return word;
}

  // getDailyWord(): string {
  //   const todayKey = new Date().toDateString();
  //   const stored = localStorage.getItem("daily_word");

  //   if (stored) {
  //     const data = JSON.parse(stored);
  //     if (data.date === todayKey) return data.word;
  //   }

  //   const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

  //   localStorage.setItem("daily_word", JSON.stringify({
  //     date: todayKey,
  //     word
  //   }));

  //   return word;
  // }

  /** HELP MODAL **/
  openHelp() { this.showHelp = true; }
  closeHelp() { this.showHelp = false;
    localStorage.setItem('has_seen_help', 'true');
   }

  /** 🏆 LEADERBOARD BUTTON TRIGGERS END MODAL */
openEndModal() { 
  // 🆕 Load current win state and completion status from stats
  const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
  if (stats.didWin !== undefined) {
    this.didWin = stats.didWin;
  }
  if (stats.gameCompleted !== undefined) {
    this.gameCompleted = stats.gameCompleted;
  }
  this.showEndModal = true; 
}

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
     if (this.gameOver) return;
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
       this.gameOver = true; // 🆕 Lock the game
        this.didWin = true; // 🆕 ADD THIS
         this.gameCompleted = true; // 🆕 Mark game as completed
           this.showEndModal = true;
      return;
    }

    if (this.currentRow === this.rowsCount - 1) {
      this.updateStats(false);
      this.lockDay();
      this.showEndModal = true;
        this.gameOver = true;
          this.didWin = false; // 🆕 ADD THIS
           this.gameCompleted = true; // 🆕 Mark game as completed
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
@HostListener("window:keydown", ["$event"])
handleKeyPress(event: KeyboardEvent) {
  const key = event.key.toUpperCase();

  if (key === "ENTER" || key === "BACKSPACE") {
    event.preventDefault();
  }

  if (key === "ENTER") this.onKey("Enter");
  else if (key === "BACKSPACE") this.onKey("Backspace");
  else if (/^[A-Z]$/.test(key)) this.onKey(key);

  if (event.key === "`") {
    alert("SECRET WORD = " + this.secret);
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
       stats.didWin = true; // 🆕 ADD THIS - Save win status
       stats.didWin = true; // 🆕 Save win status
    } else {
      stats.streak = 0;
       stats.didWin = false; // 🆕 ADD THIS - Save loss status
    }
stats.gameCompleted = true; // 🆕 Save completion status
    stats.winPercent = Math.round((stats.wins || 0) / stats.played * 100);
    stats.countdown = this.getCountdown();

    localStorage.setItem('game_stats', JSON.stringify(stats));
  }

  /** 🗓 LOCK GAME FOR TODAY */
  lockDay() {
    localStorage.setItem('last_played', new Date().toDateString());
  }

testMidnightReset() {
  console.log('🧪 Testing midnight reset...');
  
  localStorage.removeItem("board_state");
  localStorage.removeItem("last_played");
  localStorage.removeItem("daily_word");
  
  // 🆕 Also reset win state and completion status in stats
  const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
  delete stats.didWin;
  delete stats.gameCompleted; // 🆕 Clear completion status
  localStorage.setItem('game_stats', JSON.stringify(stats));
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toDateString();
  
  const epoch = new Date('2024-01-01');
  tomorrow.setHours(0, 0, 0, 0);
  const daysSinceEpoch = Math.floor((tomorrow.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const wordIndex = daysSinceEpoch % WORD_LIST.length;
  const tomorrowWord = WORD_LIST[wordIndex];
  
  localStorage.setItem("daily_word", JSON.stringify({
    date: tomorrowKey,
    word: tomorrowWord
  }));
  
  this.secret = tomorrowWord;
  this.initGrid();
  this.currentRow = 0;
  this.currentCol = 0;
  this.showEndModal = false;
  this.gameOver = false;
  this.didWin = false;
  this.gameCompleted = false; // 🆕 Reset completion status
  
  console.log('✅ Reset complete! Tomorrow\'s word:', this.secret);
  alert('✅ Game reset with TOMORROW\'S word!\n\nNew word: ' + this.secret);
}
}
