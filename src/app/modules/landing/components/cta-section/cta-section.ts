import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CtaFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-section.html',
  styleUrl: './cta-section.css'
})
export class CtaSection {
  protected readonly features = signal<CtaFeature[]>([
    {
      id: 'launch-minutes',
      icon: 'pi-bolt',
      title: 'Launch in Minutes',
      description: 'From idea to deployed application in under 10 minutes'
    },
    {
      id: 'enterprise-ready',
      icon: 'pi-shield',
      title: 'Enterprise Ready',
      description: 'Production-grade security and scalability built-in'
    },
    {
      id: 'free-forever',
      icon: 'pi-heart',
      title: 'Free Forever',
      description: 'Core features always free, no hidden costs or limits'
    }
  ]);

  protected readonly isHovered = signal<boolean>(false);

  protected onGetStarted(): void {
    // Navigate to registration or main app
    window.location.href = '/register';
  }

  protected onWatchDemo(): void {
    // Scroll to video section or open demo modal
    const videoSection = document.querySelector('app-video-trailer');
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  protected onMouseEnter(): void {
    this.isHovered.set(true);
  }

  protected onMouseLeave(): void {
    this.isHovered.set(false);
  }
}
