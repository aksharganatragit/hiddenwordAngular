import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ad-splash-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-splash.page.component.html',
  styleUrls: ['./ad-splash.page.component.scss']
})
export class AdSplashPageComponent implements OnInit, OnDestroy {
  countdown = 5; // seconds — you can change this value later
  private timer: any;

  constructor(private router: Router) {}

  ngOnInit() {
    // start countdown
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        this.goToGame();
      }
    }, 1000);
  }

  ngOnDestroy() {
    // clean up timer
    clearInterval(this.timer);
  }

  skipAd() {
    this.goToGame();
  }

  private goToGame() {
    clearInterval(this.timer);
    this.router.navigateByUrl('/game');
  }
}
