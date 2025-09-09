import { Component, input, output, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypographyModel, ColorModel } from '../../../../models/brand-identity.model';
import { ProjectModel } from '../../../../models/project.model';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-typography-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './typography-selection.html',
  styleUrl: './typography-selection.css',
})
export class TypographySelectionComponent implements OnInit, OnDestroy {
  // Services
  private readonly brandingService = inject(BrandingService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly project = input.required<ProjectModel>();
  readonly selectedTypography = input<string>();
  readonly typographyOptions = input<TypographyModel[]>([]);

  // Outputs
  readonly typographySelected = output<string>();
  readonly nextStep = output<void>();
  readonly previousStep = output<void>();
  readonly colorsAndTypographyGenerated = output<{colors: ColorModel[], typography: TypographyModel[]}>();

  // State management
  protected isGenerating = signal(false);
  protected generationProgress = signal(0);
  protected currentStep = signal('');
  protected typographyModels = signal<TypographyModel[]>([]);
  protected error = signal<string | null>(null);
  protected hasGenerated = signal(false);

  // Progress steps are now defined directly in the simulateProgress method

  ngOnInit() {
    // Force generation to show new design
    this.generateTypography();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async generateTypography(): Promise<void> {
    this.isGenerating.set(true);
    this.error.set(null);
    this.generationProgress.set(0);

    try {
      // Simulate progress for exactly 4 seconds as requested
      await this.simulateProgress();
      
      // We already have typography data from the color-selection component
      // Just display it after the 4-second loader
      console.log('Typography options ready to display:', this.typographyOptions());
      
      // Use the typography options that were passed as input
      if (this.typographyOptions() && this.typographyOptions().length > 0) {
        this.typographyModels.set(this.typographyOptions());
        this.hasGenerated.set(true);
      } else {
        // If no typography options were passed, show an error
        this.error.set('No typography options available. Please go back and try again.');
      }
    } catch (error) {
      console.error('Error in typography display:', error);
      this.error.set('Failed to display typography options. Please try again.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  private async simulateProgress(): Promise<void> {
    // Simplified progress simulation for 4 seconds total
    const totalDuration = 4000; // 4 seconds as requested
    const steps = [
      { step: 'Analyzing brand personality...', duration: 1000 },
      { step: 'Selecting font families...', duration: 1000 },
      { step: 'Creating typography pairings...', duration: 1000 },
      { step: 'Finalizing typography options...', duration: 1000 }
    ];
    
    let totalProgress = 0;
    
    for (const step of steps) {
      this.currentStep.set(step.step);
      
      const startProgress = totalProgress;
      const endProgress = totalProgress + (step.duration / totalDuration) * 100;
      
      await this.animateProgress(startProgress, endProgress, step.duration);
      totalProgress = endProgress;
    }
  }

  private async animateProgress(
    start: number,
    end: number,
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
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

  // Mock typography generation removed as we're now using the actual service

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
