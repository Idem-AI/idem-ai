import {
  Component,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ColorModel,
  TypographyModel,
} from '../../../../models/brand-identity.model';
import { ProjectModel } from '../../../../models/project.model';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { CarouselComponent } from '../../../../../../shared/components/carousel/carousel.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-color-selection',
  standalone: true,
  imports: [CommonModule, CarouselComponent],
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
  readonly colorsAndTypographyGenerated = output<{
    colors: ColorModel[];
    typography: TypographyModel[];
    project: ProjectModel;
  }>();
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

  ngOnInit() {
    console.log(this.project());
    const generatedColors = this.project().analysisResultModel?.branding?.generatedColors;
    
    if (!generatedColors || generatedColors.length === 0) {
      this.generateColors();
    } else {
      this.typographyGenerated.emit(
        this.project().analysisResultModel?.branding?.generatedTypography
      );
      this.colorsAndTypographyGenerated.emit({
        colors: this.project().analysisResultModel?.branding?.generatedColors,
        typography:
          this.project().analysisResultModel?.branding?.generatedTypography,
        project: this.project(),
      });
      this.colorPalettes.set(
        this.project().analysisResultModel?.branding?.generatedColors
      );
      this.typographyOptions.set(
        this.project().analysisResultModel?.branding?.generatedTypography
      );
      this.colorsGenerated.emit(
        this.project().analysisResultModel?.branding?.generatedColors
      );
      this.typographyGenerated.emit(
        this.project().analysisResultModel?.branding?.generatedTypography
      );

      this.hasGenerated.set(true);
      this.isGenerating.set(false);
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
      // Use actual service call instead of mockups
      this.brandingService
        .generateColorsAndTypography(this.project())
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
              project: this.project(),
            });

            // Update project with both colors and typography
            this.projectUpdate.emit({
              id: response.project.id, // Include the project ID from the response
              analysisResultModel: {
                ...this.project().analysisResultModel,
                branding: {
                  ...this.project().analysisResultModel?.branding,
                  generatedColors: response.colors,
                  generatedTypography: response.typography,
                },
              },
            });

            this.hasGenerated.set(true);
            this.isGenerating.set(false);
          },
          error: (error) => {
            console.error('Error generating colors and typography:', error);
            this.error.set(
              'Failed to generate color palettes. Please try again.'
            );
            this.isGenerating.set(false);
          },
        });
    } catch (error) {
      console.error('Error in color generation:', error);
      this.error.set('Failed to generate color palettes. Please try again.');
      this.isGenerating.set(false);
    }
  }

  protected selectColor(colorId: string): void {
    this.selectedColorId.set(colorId);
    this.colorSelected.emit(colorId);

    // Find the selected color and update the project
    const selectedColor = this.colorPalettes().find(
      (color) => color.id === colorId
    );
    if (selectedColor) {
      this.projectUpdate.emit({
        analysisResultModel: {
          ...this.project().analysisResultModel,
          branding: {
            ...this.project().analysisResultModel?.branding,
            generatedColors: this.colorPalettes(),
            colors: selectedColor,
            generatedTypography: this.typographyOptions(),
          },
        },
      });
    }
  }

  protected async retryGeneration(): Promise<void> {
    await this.generateColors();
  }

  protected goToPreviousStep(): void {
    this.previousStep.emit();
  }

  // Track function for carousel
  protected readonly trackColor = (index: number, color: ColorModel): string => {
    return color.id || `color-${index}`;
  };

  // Track function for skeleton loading
  protected readonly trackSkeleton = (index: number, item: number): string => {
    return `skeleton-${index}`;
  };
}
