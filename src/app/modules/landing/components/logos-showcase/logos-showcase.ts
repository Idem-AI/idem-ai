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
  styleUrl: './logos-showcase.css'
})
export class LogosShowcase implements OnInit, OnDestroy {
  protected readonly logos = signal<LogoExample[]>([
    {
      id: '1',
      brandName: 'TechFlow',
      industry: 'Technology',
      style: 'Modern Minimalist',
      colors: ['#1447e6', '#22d3ee'],
      description: 'Clean geometric design representing innovation and flow',
      logoUrl: '/assets/logos/techflow-logo.svg'
    },
    {
      id: '2',
      brandName: 'EcoGreen',
      industry: 'Environmental',
      style: 'Organic Natural',
      colors: ['#22c55e', '#16a34a'],
      description: 'Leaf-inspired design symbolizing sustainability',
      logoUrl: '/assets/logos/ecogreen-logo.svg'
    },
    {
      id: '3',
      brandName: 'HealthCare+',
      industry: 'Healthcare',
      style: 'Professional Trust',
      colors: ['#3b82f6', '#1e40af'],
      description: 'Medical cross with modern typography for reliability',
      logoUrl: '/assets/logos/healthcare-logo.svg'
    },
    {
      id: '4',
      brandName: 'CreativeStudio',
      industry: 'Design',
      style: 'Artistic Bold',
      colors: ['#d11ec0', '#9333ea'],
      description: 'Abstract brush stroke representing creativity',
      logoUrl: '/assets/logos/creative-logo.svg'
    },
    {
      id: '5',
      brandName: 'FinanceHub',
      industry: 'Finance',
      style: 'Corporate Solid',
      colors: ['#059669', '#047857'],
      description: 'Geometric shapes forming growth arrow',
      logoUrl: '/assets/logos/finance-logo.svg'
    },
    {
      id: '6',
      brandName: 'EduLearn',
      industry: 'Education',
      style: 'Friendly Approachable',
      colors: ['#f59e0b', '#d97706'],
      description: 'Book and lightbulb combination for knowledge',
      logoUrl: '/assets/logos/edulearn-logo.svg'
    },
    {
      id: '7',
      brandName: 'FoodieDelight',
      industry: 'Food & Beverage',
      style: 'Playful Warm',
      colors: ['#ef4444', '#dc2626'],
      description: 'Chef hat with fork creating appetizing appeal',
      logoUrl: '/assets/logos/foodie-logo.svg'
    },
    {
      id: '8',
      brandName: 'TravelWise',
      industry: 'Travel',
      style: 'Adventure Spirit',
      colors: ['#0ea5e9', '#0284c7'],
      description: 'Compass and mountain silhouette for exploration',
      logoUrl: '/assets/logos/travel-logo.svg'
    }
  ]);

  protected readonly selectedCategory = signal<string>('all');
  protected readonly hoveredLogo = signal<string | null>(null);
  private animationId?: number;

  protected readonly categories = [
    { id: 'all', name: 'All Logos', count: 8 },
    { id: 'technology', name: 'Technology', count: 1 },
    { id: 'healthcare', name: 'Healthcare', count: 1 },
    { id: 'finance', name: 'Finance', count: 1 },
    { id: 'education', name: 'Education', count: 1 },
    { id: 'design', name: 'Design', count: 1 },
    { id: 'environmental', name: 'Environmental', count: 1 },
    { id: 'food', name: 'Food & Beverage', count: 1 },
    { id: 'travel', name: 'Travel', count: 1 }
  ];

  ngOnInit(): void {
    this.startFloatingAnimation();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private startFloatingAnimation(): void {
    const animate = () => {
      // Add subtle floating animation logic here if needed
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  protected selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  protected getFilteredLogos(): LogoExample[] {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.logos();
    }
    
    return this.logos().filter(logo => 
      logo.industry.toLowerCase().includes(category.toLowerCase()) ||
      category === 'food' && logo.industry.toLowerCase().includes('food')
    );
  }

  protected onLogoHover(logoId: string | null): void {
    this.hoveredLogo.set(logoId);
  }

  protected getColorGradient(colors: string[]): string {
    if (colors.length === 1) {
      return colors[0];
    }
    return `linear-gradient(135deg, ${colors.join(', ')})`;
  }
}
