import { Component, HostListener, OnInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { HelpModalComponent } from '../../shared/help-modal/help-modal.component';
import { EndModalComponent } from '../../shared/end-modal/end-modal.component';

import { WORD_LIST, VALID_WORDS } from '../game.page/words';

import { MatIconModule } from '@angular/material/icon';


type CellState = 'correct' | 'present' | 'absent' | '';

interface Cell {
  letter: string;
  state: CellState;
}

interface Row {
  cells: Cell[];
  score?: number;
}

// 📊 Google Analytics helper
declare let gtag: Function;

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule, HelpModalComponent, EndModalComponent, MatIconModule,  RouterLink],
  templateUrl: './game.page.component.html',
  styleUrls: ['./game.page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GamePageComponent implements OnInit {
  cols = 5;
  rowsCount = 6;

  /** 🟩 DYNAMIC SECRET WORD */
  secret = 'Lemon';

  rows: Row[] = [];
  currentRow = 0;
  currentCol = 0;

  showHelp = false;
  showEndModal = false;
  errorMessage = "";
  gameOver = false;
  didWin = false;
  gameCompleted = false;
  showLegalMenu = false;

  // 🆕 Keyboard state tracking
  keyStates: Map<string, CellState> = new Map();

  // 🆕 Version tracking for cache busting
  private readonly GAME_VERSION = '1.0.2'; // Incremented to force reset

  constructor(private router: Router) {
    // Don't initialize here - do it in ngOnInit after all checks
  }

  /** 🟦 ON INIT - RESTORE BOARD & CHECK MODAL */
  ngOnInit() {
    const currentDate = new Date().toDateString();
    
    console.log('🚀 App initialized at:', currentDate);
    
    // 🆕 STEP 1: Check version FIRST (for existing users with stale cache)
    // 📊 Track game start
    this.trackEvent('game_started', {
      date: currentDate,
      timestamp: new Date().toISOString()
    });
    
    this.checkVersionAndReset();
    
    // 🆕 STEP 2: Check if new day and clear if needed
    const needsReset = this.checkAndClearIfNewDay(currentDate);
    
    // 🆕 STEP 3: Initialize word and grid (either fresh or restored)
    this.secret = this.getDailyWord();
    this.initGrid();
    
    // 🆕 STEP 4: Restore board if same day and not reset
    if (!needsReset) {
      this.restoreBoard();
    }
    
    // 🆕 STEP 5: Load completion status from stats
    this.loadGameState();
    
    // 🆕 STEP 6: Check if already played today
    const lastPlayed = localStorage.getItem('last_played');
    if (lastPlayed === currentDate && this.gameCompleted) {
      console.log('✅ Game already completed today');
      this.showEndModal = true;
      this.gameOver = true;
    }
    
    // 🆕 STEP 7: Show help for first-time users
    const hasSeenHelp = localStorage.getItem('has_seen_help');
    if (!hasSeenHelp) {
      this.showHelp = true;
    }

    // 🆕 STEP 8: Setup midnight auto-reset
    this.setupMidnightWatcher();
  }
toggleLegalMenu() {
  this.showLegalMenu = !this.showLegalMenu;
}
@HostListener('document:click', ['$event'])
handleDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  // If click is NOT inside the legal menu or trigger → close it
  if (!target.closest('.legal-menu')) {
    this.showLegalMenu = false;
  }
}
closeLegalMenu() {
  this.showLegalMenu = false;
}
  /** 🆕 CHECK VERSION AND FORCE RESET IF NEEDED */
  private trackEvent(eventName: string, params?: any) {
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
        console.log('📊 Analytics tracked:', eventName, params);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  private checkVersionAndReset() {
    const storedVersion = localStorage.getItem('game_version');
    
    if (storedVersion !== this.GAME_VERSION) {
      console.log('🔄 Version mismatch detected:', storedVersion, '->', this.GAME_VERSION);
      console.log('🧹 Clearing stale daily data...');
      
      // Clear daily-specific flags from stats
      const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
      delete stats.didWin;
      delete stats.gameCompleted;
      delete stats.countdown;
      localStorage.setItem('game_stats', JSON.stringify(stats));
      
      // Clear daily data
      localStorage.removeItem("board_state");
      localStorage.removeItem("last_played");
      
      // Only clear daily_word if it's NOT today's word
      const storedWord = localStorage.getItem("daily_word");
      if (storedWord) {
        const wordData = JSON.parse(storedWord);
        if (wordData.date !== new Date().toDateString()) {
          localStorage.removeItem("daily_word");
        }
      }
      
      // Save new version
      localStorage.setItem('game_version', this.GAME_VERSION);
      
      console.log('✅ Version updated and stale data cleared');
    }
  }

  /** 🆕 CHECK IF NEW DAY AND CLEAR IF NEEDED */
  private checkAndClearIfNewDay(currentDate: string): boolean {
    const storedDailyWord = localStorage.getItem("daily_word");
    
    if (storedDailyWord) {
      const dailyWordData = JSON.parse(storedDailyWord);
      
      if (dailyWordData.date !== currentDate) {
        console.log('🌅 NEW DAY DETECTED!');
        console.log('   Old date:', dailyWordData.date);
        console.log('   New date:', currentDate);
        this.clearGameForNewDay();
        return true;
      }
    }
    
    return false;
  }

  /** 🆕 LOAD GAME STATE FROM STATS */
  private loadGameState() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    
    if (stats.didWin !== undefined) {
      this.didWin = stats.didWin;
    }
    if (stats.gameCompleted !== undefined) {
      this.gameCompleted = stats.gameCompleted;
    }
    
    console.log('📊 Game state loaded:', {
      didWin: this.didWin,
      gameCompleted: this.gameCompleted
    });
  }

  /** 🆕 SETUP MIDNIGHT WATCHER */
  private setupMidnightWatcher() {
    setInterval(() => {
      const now = new Date().toDateString();
      const stored = localStorage.getItem("daily_word");
      
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date !== now) {
          console.log('⏰ MIDNIGHT DETECTED - Resetting game...');
          console.log('   Old date:', data.date);
          console.log('   New date:', now);
          
          // Clear everything synchronously
          this.clearGameForNewDay();
          
          // Small delay to ensure localStorage is fully written
          setTimeout(() => {
            location.reload();
          }, 100);
        }
      }
    }, 30000); // Check every 30 seconds for faster detection
  }

  /** 🧹 CLEAR GAME DATA FOR NEW DAY */
  private clearGameForNewDay() {
    console.log('🧹 Clearing all game data for new day...');
    
    // Clear board and daily tracking
    localStorage.removeItem("board_state");
    localStorage.removeItem("last_played");
    localStorage.removeItem("daily_word");
    
    // Clear daily game completion status from stats
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    delete stats.didWin;
    delete stats.gameCompleted;
    delete stats.countdown;
    localStorage.setItem('game_stats', JSON.stringify(stats));
    
    // Reset all game state variables
    this.gameOver = false;
    this.didWin = false;
    this.gameCompleted = false;
    this.showEndModal = false;
    this.currentRow = 0;
    this.currentCol = 0;
    this.errorMessage = '';
    
    // 🆕 RESET KEYBOARD STATES
    this.keyStates.clear();
    
    console.log('✅ Game data cleared successfully');
  }

  /** 🎯 RESTORE PREVIOUS BOARD */
  restoreBoard() {
    const storedBoard = localStorage.getItem("board_state");
    if (!storedBoard) {
      console.log('📋 No stored board found - starting fresh');
      return;
    }

    // Double-check we're on the same day
    const storedWord = localStorage.getItem("daily_word");
    if (storedWord) {
      const wordData = JSON.parse(storedWord);
      if (wordData.date !== new Date().toDateString()) {
        console.log('⚠️ Stored board is from different day - ignoring');
        return;
      }
    }

    console.log('📋 Restoring board from storage...');
    
    const grid = JSON.parse(storedBoard);

    grid.forEach((row: any, ri: number) =>
      row.forEach((cell: any, ci: number) => {
        if (this.rows[ri] && this.rows[ri].cells[ci]) {
          this.rows[ri].cells[ci].letter = cell.letter;
          this.rows[ri].cells[ci].state = cell.state;
        }
      })
    );

    // 🆕 RESTORE KEYBOARD STATES from completed rows
    grid.forEach((row: any, ri: number) => {
      const hasContent = row.some((c: any) => c.letter !== "");
      if (hasContent) {
        this.updateKeyboardStates(this.rows[ri].cells);
      }
    });

    // Find next empty row
    this.currentRow = grid.findIndex((r: any) => r.some((c: any) => c.letter === ""));
    
    if (this.currentRow === -1) {
      // All rows filled - game was completed
      this.currentRow = this.rowsCount - 1;
    }
    
    // Set current column to first empty cell in current row
    const currentRowData = grid[this.currentRow];
    if (currentRowData) {
      this.currentCol = currentRowData.findIndex((c: any) => c.letter === "");
      if (this.currentCol === -1) this.currentCol = this.cols;
    }
    
    console.log('✅ Board restored - currentRow:', this.currentRow, 'currentCol:', this.currentCol);
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
      if (data.date === todayKey) {
        console.log('📖 Using stored word for today');
        return data.word;
      }
    }

    console.log('🎲 Generating new word for:', todayKey);

    // 🎯 DATE-BASED INDEX - Same word for everyone on same day!
    const epoch = new Date('2024-01-01');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysSinceEpoch = Math.floor((today.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceEpoch % WORD_LIST.length;
    
    const word = WORD_LIST[wordIndex];

    localStorage.setItem("daily_word", JSON.stringify({
      date: todayKey,
      word
    }));

    console.log('✅ New word generated and stored');
    return word;
  }

  /** HELP MODAL **/
  openHelp() { 
    this.showHelp = true; 
  }
  
  closeHelp() { 
    this.showHelp = false;
    localStorage.setItem('has_seen_help', 'true');
  }

  /** 🏆 LEADERBOARD BUTTON TRIGGERS END MODAL */
  openEndModal() { 
    // 🆕 Load current win state and completion status from stats
    this.loadGameState();
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
    
    // 🆕 RESET KEYBOARD STATES when initializing
    this.keyStates.clear();
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

    /** ⛔ VALIDATION: MUST be a real English word */
    if (!VALID_WORDS.includes(guess)) {
      this.errorMessage = "⛔ Not a valid English word";
      setTimeout(() => (this.errorMessage = ""), 2000);
      return;
    }

    /** 🟩 VALID WORD → Evaluate */
    this.evaluateGuess(guess);
    
    this.saveBoardState();

    /** Move to next row ONLY if valid and game not over */
    if (!this.gameOver && this.currentRow < this.rowsCount - 1) {
      this.currentRow++;
      this.currentCol = 0;
    }
  }

  /** 🧠 WORD CHECKER */
  evaluateGuess(guess: string) {
    // normalize to same case so comparisons are consistent
    const secretArr = this.secret.toUpperCase().split('');
    const guessArr = guess.toUpperCase().split('');
    const states: CellState[] = Array(this.cols).fill('absent');

    // First pass: mark correct letters
    guessArr.forEach((l, i) => {
      if (secretArr[i] === l) {
        states[i] = 'correct';
        secretArr[i] = '_';
      }
    });

    // Second pass: mark present letters
    guessArr.forEach((l, i) => {
      if (states[i] === 'absent' && secretArr.includes(l)) {
        states[i] = 'present';
        secretArr[secretArr.indexOf(l)] = '_';
      }
    });

    // Apply states and calculate score (score = number of non-absent)
    let matchCount = 0;
    let correctCount = 0; // <-- count positional matches for win
    states.forEach((st, i) => {
      this.rows[this.currentRow].cells[i].state = st;
      if (st !== 'absent') matchCount++;
      if (st === 'correct') correctCount++;
    });

    this.rows[this.currentRow].score = matchCount;

    // 🆕 UPDATE KEYBOARD STATES AFTER EVALUATING
    this.updateKeyboardStates(this.rows[this.currentRow].cells);

    // Check win condition: require ALL letters to be correct (positional)
    if (correctCount === this.cols) {
      console.log('🎉 PLAYER WON!');
      this.updateStats(true);
      this.lockDay();
      this.gameOver = true;
      this.didWin = true;
      this.gameCompleted = true;
      this.showEndModal = true;

      this.trackEvent('game_completed', {
        result: 'win',
        attempts: this.currentRow + 1,
        date: new Date().toDateString()
      });

      return;
    }

    // Check loss condition
    if (this.currentRow === this.rowsCount - 1) {
      console.log('😢 Player lost - word was:', this.secret);
      this.updateStats(false);
      this.lockDay();
      this.gameOver = true;
      this.didWin = false;
      this.gameCompleted = true;
      this.showEndModal = true;

      this.trackEvent('game_completed', {
        result: 'loss',
        attempts: this.rowsCount,
        date: new Date().toDateString()
      });
    }
  }

  /** 🆕 GET KEYBOARD KEY STATE */
  getKeyState(key: string): CellState {
    // Special keys don't get colored
    if (key === 'Enter' || key === 'Backspace') {
      return '';
    }
    
    const state = this.keyStates.get(key.toUpperCase());
    return state || '';
  }

  /** 🆕 UPDATE KEYBOARD STATES */
  private updateKeyboardStates(rowCells: Cell[]) {
    rowCells.forEach(cell => {
      const letter = cell.letter.toUpperCase();
      const currentState = this.keyStates.get(letter);
      
      // Priority: correct > present > absent
      // Don't downgrade a key's state
      if (cell.state === 'correct') {
        this.keyStates.set(letter, 'correct');
      } else if (cell.state === 'present' && currentState !== 'correct') {
        this.keyStates.set(letter, 'present');
      } else if (cell.state === 'absent' && !currentState) {
        this.keyStates.set(letter, 'absent');
      }
    });
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

    // Debug shortcut
    if (event.key === "`") {
      console.log('🔍 DEBUG INFO:');
      console.log('Secret word:', this.secret);
      console.log('Current date:', new Date().toDateString());
      console.log('Stored word:', localStorage.getItem('daily_word'));
      console.log('Game state:', {
        gameOver: this.gameOver,
        didWin: this.didWin,
        gameCompleted: this.gameCompleted
      });
      console.log('Keyboard states:', this.keyStates);
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
      stats.didWin = true;
    } else {
      stats.streak = 0;
      stats.didWin = false;
    }
    
    stats.gameCompleted = true;
    stats.winPercent = Math.round((stats.wins || 0) / stats.played * 100);
    stats.countdown = this.getCountdown();

    localStorage.setItem('game_stats', JSON.stringify(stats));
    
    console.log('📊 Stats updated:', stats);
  }

  /** 🗓️ LOCK GAME FOR TODAY */
  lockDay() {
    const today = new Date().toDateString();
    localStorage.setItem('last_played', today);
    console.log('🔒 Game locked for:', today);
  }

  /** 🧪 TEST MIDNIGHT RESET (FOR DEBUGGING) */
  testMidnightReset() {
    console.log('🧪 Testing midnight reset...');
    
    // Calculate tomorrow's word
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = tomorrow.toDateString();
    
    const epoch = new Date('2024-01-01');
    tomorrow.setHours(0, 0, 0, 0);
    const daysSinceEpoch = Math.floor((tomorrow.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceEpoch % WORD_LIST.length;
    const tomorrowWord = WORD_LIST[wordIndex];
    
    // Set tomorrow's word in storage
    localStorage.setItem("daily_word", JSON.stringify({
      date: tomorrowKey,
      word: tomorrowWord
    }));
    
    // Clear today's game data
    this.clearGameForNewDay();
    
    console.log('✅ Reset complete! Reloading...');
    
    // Reload after small delay
    setTimeout(() => {
      location.reload();
    }, 500);
  }
}