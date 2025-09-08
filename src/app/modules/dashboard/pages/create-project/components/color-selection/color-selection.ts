import {
  Component,
  input,
  output,
  signal,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorModel, TypographyModel } from '../../../../models/brand-identity.model';
import { ProjectModel } from '../../../../models/project.model';

@Component({
  selector: 'app-color-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-selection.html',
  styleUrl: './color-selection.css',
})
export class ColorSelectionComponent implements OnInit {

  // Inputs
  readonly project = input.required<ProjectModel>();
  readonly selectedColor = input<string>();

  // Outputs
  readonly colorSelected = output<string>();
  readonly colorsGenerated = output<ColorModel[]>();
  readonly typographyGenerated = output<TypographyModel[]>();
  readonly nextStep = output<void>();
  readonly previousStep = output<void>();

  // State management
  protected isGenerating = signal(false);
  protected generationProgress = signal(0);
  protected currentStep = signal('');
  protected colorPalettes = signal<ColorModel[]>([]);
  protected error = signal<string | null>(null);
  protected hasGenerated = signal(false);

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

  protected async generateColors(): Promise<void> {
    this.isGenerating.set(true);
    this.error.set(null);
    this.generationProgress.set(0);

    try {
      // Simulate progress
      await this.simulateProgress();

      // Mock color generation - replace with actual service call
      const mockColors = this.generateMockColors();
      this.colorPalettes.set(mockColors);
      this.colorsGenerated.emit(mockColors);

      // Generate typography as well
      const mockTypography = this.generateMockTypography();
      this.typographyGenerated.emit(mockTypography);

      this.hasGenerated.set(true);
    } catch (error) {
      this.error.set('Failed to generate color palettes. Please try again.');
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

  private generateMockColors(): ColorModel[] {
    return [
      {
        id: '1',
        name: 'Ocean Breeze',
        url: '',
        colors: {
          primary: '#0EA5E9',
          secondary: '#0284C7',
          accent: '#F0F9FF',
          background: '#FFFFFF',
          text: '#1F2937'
        }
      },
      {
        id: '2',
        name: 'Forest Harmony',
        url: '',
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#ECFDF5',
          background: '#FFFFFF',
          text: '#1F2937'
        }
      },
      {
        id: '3',
        name: 'Sunset Glow',
        url: '',
        colors: {
          primary: '#EA580C',
          secondary: '#DC2626',
          accent: '#FFF7ED',
          background: '#FFFFFF',
          text: '#1F2937'
        }
      }
    ];
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
      }
    ];
  }

  protected selectColor(colorId: string): void {
    this.colorSelected.emit(colorId);
    this.nextStep.emit();
  }

  protected async retryGeneration(): Promise<void> {
    await this.generateColors();
  }

  protected goToPreviousStep(): void {
    this.previousStep.emit();
  }
}
