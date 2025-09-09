import {
  Component,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorModel, TypographyModel } from '../../../../models/brand-identity.model';
import { ProjectModel } from '../../../../models/project.model';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-color-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-selection.html',
  styleUrl: './color-selection.css',
})
export class ColorSelectionComponent implements OnInit, OnDestroy {

  // Services
  private readonly brandingService = inject(BrandingService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly project = input.required<ProjectModel>();
  readonly selectedColor = input<string>();

  // Outputs
  readonly colorSelected = output<string>();
  readonly colorsGenerated = output<ColorModel[]>();
  readonly typographyGenerated = output<TypographyModel[]>();
  readonly colorsAndTypographyGenerated = output<{colors: ColorModel[], typography: TypographyModel[], project: ProjectModel}>();
  readonly projectUpdate = output<Partial<ProjectModel>>();
  readonly nextStep = output<void>();
  readonly previousStep = output<void>();

  // State management
  protected isGenerating = signal(false);
  protected generationProgress = signal(0);
  protected currentStep = signal('');
  protected colorPalettes = signal<ColorModel[]>([]);
  protected typographyOptions = signal<TypographyModel[]>([]);
  protected error = signal<string | null>(null);
  protected hasGenerated = signal(false);
  protected selectedColorId = signal<string | null>(null);

  // Progress steps
  private progressSteps = [
    { step: 'Analyzing project requirements...', duration: 1000 },
    { step: 'Generating color harmonies...', duration: 2000 },
    { step: 'Creating palette variations...', duration: 1500 },
    { step: 'Optimizing for accessibility...', duration: 1000 },
    { step: 'Finalizing color schemes...', duration: 500 }
  ];

  ngOnInit() {
    if (!this.hasGenerated()) {
      this.generateColors();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected async generateColors(): Promise<void> {
    this.isGenerating.set(true);
    this.error.set(null);
    this.generationProgress.set(0);

    try {
      // Simulate progress
      await this.simulateProgress();

      // Use actual service call instead of mockups
      this.brandingService.generateColorsAndTypography(this.project())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Colors and typography generated:', response);
            this.colorPalettes.set(response.colors);
            this.typographyOptions.set(response.typography);
            this.colorsGenerated.emit(response.colors);
            
            // Emit typography as well
            this.typographyGenerated.emit(response.typography);
            
            // Emit both colors and typography together
            this.colorsAndTypographyGenerated.emit({
              colors: response.colors,
              typography: response.typography,
              project: this.project()
            });
            
            // Update project with both colors and typography
            this.projectUpdate.emit({
              id: response.project.id, // Include the project ID from the response
              analysisResultModel: {
                ...this.project().analysisResultModel,
                branding: {
                  ...this.project().analysisResultModel?.branding,
                  generatedColors: response.colors,
                  generatedTypography: response.typography
                }
              }
            });
            
            this.hasGenerated.set(true);
            this.isGenerating.set(false);
          },
          error: (error) => {
            console.error('Error generating colors and typography:', error);
            this.error.set('Failed to generate color palettes. Please try again.');
            this.isGenerating.set(false);
          }
        });
    } catch (error) {
      console.error('Error in color generation:', error);
      this.error.set('Failed to generate color palettes. Please try again.');
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

  // Mock color generation removed as we're now using the actual service

  // Mock typography generation removed as we're now using the actual service

  protected selectColor(colorId: string): void {
    this.selectedColorId.set(colorId);
    this.colorSelected.emit(colorId);
    
    // Find the selected color and update the project
    const selectedColor = this.colorPalettes().find(color => color.id === colorId);
    if (selectedColor) {
      this.projectUpdate.emit({
        analysisResultModel: {
          ...this.project().analysisResultModel,
          branding: {
            ...this.project().analysisResultModel?.branding,
            generatedColors: this.colorPalettes(),
            colors: selectedColor,
            generatedTypography: this.typographyOptions()
          }
        }
      });
    }
  }

  protected async retryGeneration(): Promise<void> {
    await this.generateColors();
  }

  protected goToPreviousStep(): void {
    this.previousStep.emit();
  }
}
