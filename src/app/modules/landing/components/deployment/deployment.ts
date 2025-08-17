import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DeploymentMode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  features: string[];
  targetAudience: string;
  color: string;
}

@Component({
  selector: 'app-deployment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deployment.html',
  styleUrl: './deployment.css'
})
export class Deployment {
  protected readonly selectedMode = signal<string>('conversational');

  protected readonly deploymentModes = signal<DeploymentMode[]>([
    {
      id: 'conversational',
      title: 'AI Assistant',
      subtitle: 'Conversational Mode',
      description: 'Ideal for beginners who prefer describing their needs in natural language, letting AI propose and refine the architecture.',
      icon: 'pi-comments',
      features: [
        'Natural language interaction',
        'AI-powered architecture suggestions',
        'Step-by-step guidance',
        'Automatic optimization'
      ],
      targetAudience: 'Beginners & Business Users',
      color: '#1447e6'
    },
    {
      id: 'quick',
      title: 'Quick Deploy',
      subtitle: 'One-Click Mode',
      description: 'Perfect for rapid deployment with minimal configuration. Your application is deployed with a single click.',
      icon: 'pi-bolt',
      features: [
        'One-click deployment',
        'Pre-configured settings',
        'Instant results',
        'Zero configuration required'
      ],
      targetAudience: 'All Users',
      color: '#22c55e'
    },
    {
      id: 'templates',
      title: 'Architecture Templates',
      subtitle: 'Accelerated Mode',
      description: 'Perfect for common architectures, offering an optimized starting point that can be customized to your needs.',
      icon: 'pi-th-large',
      features: [
        'Pre-built templates',
        'Industry best practices',
        'Customizable components',
        'Proven architectures'
      ],
      targetAudience: 'Intermediate Users',
      color: '#d11ec0'
    },
    {
      id: 'expert',
      title: 'Component Catalog',
      subtitle: 'Expert Mode',
      description: 'Offers maximum flexibility for unique architectures, allowing you to select and configure each service individually.',
      icon: 'pi-cog',
      features: [
        'Full component control',
        'Advanced configuration',
        'Custom architectures',
        'Maximum flexibility'
      ],
      targetAudience: 'Expert Users',
      color: '#f59e0b'
    }
  ]);

  protected selectMode(modeId: string): void {
    this.selectedMode.set(modeId);
  }

  protected getSelectedMode(): DeploymentMode {
    const modes = this.deploymentModes();
    return modes.find(mode => mode.id === this.selectedMode()) || modes[0];
  }
}
