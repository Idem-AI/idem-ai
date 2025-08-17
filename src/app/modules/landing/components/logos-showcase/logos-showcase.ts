import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface LogoExample {
  id: string;
  brandName: string;
  industry: string;
  style: string;
  colors: string[];
  description: string;
  logoUrl: string;
}

@Component({
  selector: 'app-logos-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logos-showcase.html',
  styleUrl: './logos-showcase.css',
})
export class LogosShowcase {
  protected readonly logos = signal<LogoExample[]>([
    {
      id: '1',
      brandName: 'TechFlow',
      industry: 'Technology',
      style: 'Modern Minimalist',
      colors: ['#1447e6', '#22d3ee'],
      description: 'Clean geometric design representing innovation and flow',
      logoUrl: '/assets/logos/techflow-logo.svg',
    },
    {
      id: '2',
      brandName: 'EcoGreen',
      industry: 'Environmental',
      style: 'Organic Natural',
      colors: ['#22c55e', '#16a34a'],
      description: 'Leaf-inspired design symbolizing sustainability',
      logoUrl: '/assets/logos/ecogreen-logo.svg',
    },
    {
      id: '3',
      brandName: 'HealthCare+',
      industry: 'Healthcare',
      style: 'Professional Trust',
      colors: ['#3b82f6', '#1e40af'],
      description: 'Medical cross with modern typography for reliability',
      logoUrl: '/assets/logos/healthcare-logo.svg',
    },
    {
      id: '4',
      brandName: 'CreativeStudio',
      industry: 'Design',
      style: 'Artistic Bold',
      colors: ['#d11ec0', '#9333ea'],
      description: 'Abstract brush stroke representing creativity',
      logoUrl: '/assets/logos/creative-logo.svg',
    },
  ]);

  // No additional state needed for simplified showcase

  protected getColorGradient(colors: string[]): string {
    if (colors.length === 1) {
      return colors[0];
    }
    return `linear-gradient(135deg, ${colors.join(', ')})`;
  }

  protected getVisibleLogos(): LogoExample[] {
    // Return only first 4 logos for simplified showcase
    return this.logos().slice(0, 4);
  }
}
