import {
  Component,
  input,
  output,
  signal,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypographyModel } from '../../../../models/brand-identity.model';
import { ProjectModel } from '../../../../models/project.model';

@Component({
  selector: 'app-typography-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typography-selection.html',
  styleUrl: './typography-selection.css',
})
export class TypographySelectionComponent implements OnInit {
  // Inputs
  readonly project = input.required<ProjectModel>();
  readonly selectedTypography = input<string>();
  readonly typographyOptions = input<TypographyModel[]>([]);

  // Outputs
  readonly typographySelected = output<string>();
  readonly nextStep = output<void>();
  readonly previousStep = output<void>();

  // State management
  protected isGenerating = signal(false);
  protected generationProgress = signal(0);
  protected currentStep = signal('');
  protected typographyModels = signal<TypographyModel[]>([]);
  protected error = signal<string | null>(null);
  protected hasGenerated = signal(false);

  // Progress steps
  private progressSteps = [
    { step: 'Analyzing brand personality...', duration: 1000 },
    { step: 'Selecting font families...', duration: 1500 },
    { step: 'Creating typography pairings...', duration: 2000 },
    { step: 'Optimizing readability...', duration: 1000 },
    { step: 'Finalizing typography options...', duration: 500 }
  ];

  ngOnInit() {
    // Use provided typography options if available, otherwise generate new ones
    if (this.typographyOptions().length > 0) {
      this.typographyModels.set(this.typographyOptions());
      this.hasGenerated.set(true);
    } else if (!this.hasGenerated()) {
      this.generateTypography();
    }
  }

  protected async generateTypography(): Promise<void> {
    this.isGenerating.set(true);
    this.error.set(null);
    this.generationProgress.set(0);

    try {
      // Simulate progress
      await this.simulateProgress();

      // Mock typography generation - replace with actual service call
      const mockTypography = this.generateMockTypography();
      this.typographyModels.set(mockTypography);

      this.hasGenerated.set(true);
    } catch (error) {
      this.error.set('Failed to generate typography options. Please try again.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  private async simulateProgress(): Promise<void> {
    let totalProgress = 0;
    const totalDuration = this.progressSteps.reduce((sum, step) => sum + step.duration, 0);

    for (const step of this.progressSteps) {
      this.currentStep.set(step.step);
      
      const startProgress = totalProgress;
      const endProgress = totalProgress + (step.duration / totalDuration) * 100;
      
      await this.animateProgress(startProgress, endProgress, step.duration);
      totalProgress = endProgress;
    }
  }

  private async animateProgress(start: number, end: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentProgress = start + (end - start) * progress;
        
        this.generationProgress.set(Math.round(currentProgress));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private generateMockTypography(): TypographyModel[] {
    return [
      {
        id: '1',
        name: 'Modern Sans',
        url: '',
        primaryFont: 'Inter',
        secondaryFont: 'Inter'
      },
      {
        id: '2',
        name: 'Classic Serif',
        url: '',
        primaryFont: 'Playfair Display',
        secondaryFont: 'Source Serif Pro'
      },
      {
        id: '3',
        name: 'Creative Mix',
        url: '',
        primaryFont: 'Montserrat',
        secondaryFont: 'Open Sans'
      },
      {
        id: '4',
        name: 'Elegant Script',
        url: '',
        primaryFont: 'Dancing Script',
        secondaryFont: 'Lato'
      }
    ];
  }

  protected selectTypography(typographyId: string): void {
    this.typographySelected.emit(typographyId);
    // Removed auto-navigation - user must click Next button
  }

  protected async retryGeneration(): Promise<void> {
    await this.generateTypography();
  }

  protected goToPreviousStep(): void {
    this.previousStep.emit();
  }
}
