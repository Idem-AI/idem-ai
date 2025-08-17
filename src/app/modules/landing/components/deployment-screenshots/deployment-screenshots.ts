import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DeploymentScreenshot {
  id: string;
  mode: string;
  title: string;
  description: string;
  imageUrl: string;
  features: string[];
  color: string;
}

@Component({
  selector: 'app-deployment-screenshots',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deployment-screenshots.html',
  styleUrl: './deployment-screenshots.css'
})
export class DeploymentScreenshots implements OnInit, OnDestroy {
  protected readonly activeScreenshot = signal<number>(0);
  private rotationInterval?: number;

  protected readonly screenshots = signal<DeploymentScreenshot[]>([
    {
      id: 'conversational-ui',
      mode: 'AI Assistant',
      title: 'Conversational Interface',
      description: 'Natural language interaction with AI-powered architecture suggestions and real-time guidance.',
      imageUrl: '/assets/screenshots/conversational-mode.png',
      features: [
        'Chat-based interface',
        'Real-time AI responses',
        'Architecture visualization',
        'Step-by-step guidance'
      ],
      color: '#1447e6'
    },
    {
      id: 'quick-deploy-ui',
      mode: 'Quick Deploy',
      title: 'One-Click Deployment',
      description: 'Streamlined interface for instant deployment with minimal user input required.',
      imageUrl: '/assets/screenshots/quick-deploy-mode.png',
      features: [
        'Single-click deployment',
        'Progress indicators',
        'Automatic configuration',
        'Instant results'
      ],
      color: '#22c55e'
    },
    {
      id: 'templates-ui',
      mode: 'Architecture Templates',
      title: 'Template Selection',
      description: 'Gallery of pre-built architecture templates with customization options and preview capabilities.',
      imageUrl: '/assets/screenshots/templates-mode.png',
      features: [
        'Template gallery',
        'Live preview',
        'Customization panel',
        'Architecture diagrams'
      ],
      color: '#d11ec0'
    },
    {
      id: 'expert-ui',
      mode: 'Component Catalog',
      title: 'Advanced Configuration',
      description: 'Comprehensive component catalog with detailed configuration options and dependency management.',
      imageUrl: '/assets/screenshots/expert-mode.png',
      features: [
        'Component library',
        'Advanced settings',
        'Dependency graph',
        'Custom configurations'
      ],
      color: '#f59e0b'
    }
  ]);

  ngOnInit(): void {
    this.startAutoRotation();
  }

  ngOnDestroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = undefined;
    }
  }

  private startAutoRotation(): void {
    this.rotationInterval = window.setInterval(() => {
      const screenshots = this.screenshots();
      const current = this.activeScreenshot();
      const next = (current + 1) % screenshots.length;
      this.activeScreenshot.set(next);
    }, 6000);
  }

  protected selectScreenshot(index: number): void {
    this.activeScreenshot.set(index);
  }

  protected getCurrentScreenshot(): DeploymentScreenshot {
    return this.screenshots()[this.activeScreenshot()];
  }
}
