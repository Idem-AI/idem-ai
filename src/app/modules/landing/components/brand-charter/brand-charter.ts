import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BrandElement {
  id: string;
  title: string;
  description: string;
  icon: string;
  examples: string[];
}

interface BrandShowcase {
  id: string;
  brandName: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoStyle: string;
  description: string;
}

@Component({
  selector: 'app-brand-charter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-charter.html',
  styleUrl: './brand-charter.css'
})
export class BrandCharter implements OnInit {
  protected readonly activeTab = signal<string>('elements');
  
  protected readonly brandElements = signal<BrandElement[]>([
    {
      id: 'colors',
      title: 'Color Palette',
      description: 'Carefully selected colors that reflect your brand personality and create emotional connections',
      icon: 'pi-palette',
      examples: ['Primary Colors', 'Secondary Colors', 'Accent Colors', 'Neutral Tones']
    },
    {
      id: 'typography',
      title: 'Typography',
      description: 'Font families and text styles that ensure consistent communication across all touchpoints',
      icon: 'pi-font',
      examples: ['Headings Font', 'Body Text Font', 'Display Font', 'Monospace Font']
    },
    {
      id: 'logo',
      title: 'Logo Variations',
      description: 'Multiple logo formats and variations for different use cases and applications',
      icon: 'pi-star',
      examples: ['Primary Logo', 'Secondary Mark', 'Icon Version', 'Monochrome']
    },
    {
      id: 'imagery',
      title: 'Visual Style',
      description: 'Guidelines for photography, illustrations, and visual elements that support your brand',
      icon: 'pi-image',
      examples: ['Photography Style', 'Illustration Style', 'Icon Style', 'Pattern Library']
    }
  ]);

  protected readonly brandShowcases = signal<BrandShowcase[]>([
    {
      id: '1',
      brandName: 'TechFlow Solutions',
      industry: 'Technology',
      primaryColor: '#1447e6',
      secondaryColor: '#22d3ee',
      fontFamily: 'Inter',
      logoStyle: 'Modern Geometric',
      description: 'Clean, professional brand identity for a B2B SaaS platform'
    },
    {
      id: '2',
      brandName: 'EcoGreen Marketplace',
      industry: 'Environmental',
      primaryColor: '#22c55e',
      secondaryColor: '#16a34a',
      fontFamily: 'Poppins',
      logoStyle: 'Organic Natural',
      description: 'Sustainable and eco-friendly brand identity for green products'
    },
    {
      id: '3',
      brandName: 'CreativeStudio',
      industry: 'Design Agency',
      primaryColor: '#d11ec0',
      secondaryColor: '#9333ea',
      fontFamily: 'Montserrat',
      logoStyle: 'Artistic Bold',
      description: 'Dynamic and creative brand identity for a design agency'
    }
  ]);

  ngOnInit(): void {
    // Component initialization
  }

  protected setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  protected getColorContrast(color: string): string {
    // Simple color contrast calculation
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }
}
