import {
  Component,
  OnInit,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css',
})
export class SplashScreenComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly loading = signal(true);
  protected readonly progress = signal(0);
  protected readonly animationComplete = signal(false);

  private progressInterval?: number;
  private loadingTimeout?: number;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // In SSR context, skip splash screen
      this.loading.set(false);
      return;
    }

    this.startSimpleLoadingSequence();
  }

  private startSimpleLoadingSequence(): void {
    this.progress.set(0);
    
    // Simple progressive loading without complex event listeners
    this.progressInterval = window.setInterval(() => {
      const currentProgress = this.progress();
      if (currentProgress < 90) {
        this.progress.set(currentProgress + 10);
      }
    }, 200);

    // Complete loading after a reasonable time
    this.loadingTimeout = window.setTimeout(() => {
      this.completeLoading();
    }, 2000);

    // Also listen for window load as a fallback
    if (document.readyState === 'complete') {
      // Page already loaded
      setTimeout(() => this.completeLoading(), 500);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.completeLoading(), 500);
      }, { once: true });
    }
  }

  private completeLoading(): void {
    // Clear any running intervals
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = undefined;
    }

    // Complete the loading sequence
    this.progress.set(100);
    
    setTimeout(() => {
      this.animationComplete.set(true);
      
      setTimeout(() => {
        this.loading.set(false);
      }, 300);
    }, 500);
  }

  ngOnDestroy(): void {
    // Clean up intervals and timeouts
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }
}
