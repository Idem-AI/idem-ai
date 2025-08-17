import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  // State properties
  protected mouseX = signal(0);
  protected mouseY = signal(0);
  protected scrollY = signal(0);
  protected isInViewport = signal(true);
  protected spotlightX = signal(0);
  protected spotlightY = signal(0);
}
