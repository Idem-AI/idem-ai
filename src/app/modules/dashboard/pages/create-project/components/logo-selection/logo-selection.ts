import {
  Component,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../../projects-list/safehtml.pipe';
import { LogoModel } from '../../../../models/logo.model';
import { CarouselComponent } from '../../../../../../shared/components/carousel/carousel.component';

import { Subject, takeUntil } from 'rxjs';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { ProjectModel } from '../../../../models/project.model';

@Component({
  selector: 'app-logo-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, CarouselComponent],
  templateUrl: './logo-selection.html',
  styleUrl: './logo-selection.css',
})
export class LogoSelectionComponent implements OnInit, OnDestroy {
  // Services
  private readonly brandingService = inject(BrandingService);
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly projectId = input<string>();
  readonly logos = input<LogoModel[]>();
  readonly selectedLogo = input<string>();
  readonly project = input<ProjectModel>();

  // Outputs
  readonly logoSelected = output<string>();
  readonly logosGenerated = output<LogoModel[]>();
  readonly projectUpdate = output<ProjectModel>();
  readonly nextStep = output<void>();

  // Internal state
  protected readonly isGenerating = signal(false);
  protected readonly generatedLogos = signal<LogoModel[]>([]);
  protected readonly generationProgress = signal(0);
  protected readonly currentStep = signal('');
  protected readonly estimatedTime = signal('2-3 minutes');
  protected readonly hasStartedGeneration = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedLogoId = signal<string | null>(null);

  // Computed properties
  protected readonly shouldShowLoader = computed(() => {
    return this.isGenerating() && this.generatedLogos().length === 0;
  });

  protected readonly shouldShowLogos = computed(() => {
    const inputLogos = this.logos();
    const generatedLogos = this.generatedLogos();
    return (inputLogos && inputLogos.length > 0) || generatedLogos.length > 0;
  });

  protected readonly displayedLogos = computed(() => {
    const inputLogos = this.logos();
    const generatedLogos = this.generatedLogos();
    return inputLogos && inputLogos.length > 0 ? inputLogos : generatedLogos;
  });

  // Computed property for template binding
  protected readonly selectedLogoComputed = computed(() => {
    return this.selectedLogoId();
  });

  protected readonly shouldShowInitialPrompt = computed(() => {
    return (
      !this.shouldShowLoader() &&
      !this.shouldShowLogos() &&
      !this.hasStartedGeneration()
    );
  });

  // Track function for carousel
  protected readonly trackLogo = (index: number, logo: LogoModel): string => {
    return logo.id || `logo-${index}`;
  };

  // Track function for skeleton loading
  protected readonly trackSkeleton = (index: number, item: number): string => {
    return `skeleton-${index}`;
  };

  ngOnInit(): void {
    const hasNoLogos = !this.logos() || this.logos()?.length === 0;

    if (hasNoLogos && !this.hasStartedGeneration()) {
      this.startLogoGeneration();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected selectLogo(logoId: string): void {
    // Update selected logo state
    this.selectedLogoId.set(logoId);
    this.logoSelected.emit(logoId);

    // Find the selected logo and update the project
    const selectedLogo = this.displayedLogos().find(
      (logo) => logo.id === logoId
    );
    if (selectedLogo) {
      const currentProject = this.project();
      const currentBranding = currentProject?.analysisResultModel?.branding;
      
      // Ensure all required BrandIdentityModel properties are present
      const updatedBranding = {
        id: currentBranding?.id,
        createdAt: currentBranding?.createdAt,
        updatedAt: currentBranding?.updatedAt,
        logo: selectedLogo,
        generatedLogos: this.displayedLogos(),
        colors: currentBranding?.colors!,
        generatedColors: currentBranding?.generatedColors || [],
        typography: currentBranding?.typography!,
        generatedTypography: currentBranding?.generatedTypography || [],
        sections: currentBranding?.sections || [],
        pdfBlob: currentBranding?.pdfBlob,
      };
      
      this.projectUpdate.emit({
        ...currentProject,
        analysisResultModel: {
          ...currentProject?.analysisResultModel,
          branding: updatedBranding,
        },
      } as ProjectModel);
    }
  }

  protected goToNextStep(): void {
    this.nextStep.emit();
  }

  protected startLogoGeneration(): void {
    if (this.isGenerating() || this.hasStartedGeneration()) {
      return;
    }

    this.hasStartedGeneration.set(true);
    this.isGenerating.set(true);
    this.currentStep.set('Initializing logo generation...');
    this.generationProgress.set(0);

    // Simuler les mises à jour de progression
    this.simulateProgress();

    // Récupérer les couleurs et typographie sélectionnées depuis le projet
    const project = this.project();
    const selectedColor = project?.analysisResultModel?.branding?.colors;
    const selectedTypography =
      project?.analysisResultModel?.branding?.typography;

    if (!selectedColor || !selectedTypography) {
      this.error.set(
        'Couleur et typographie doivent être sélectionnées avant la génération de logos.'
      );
      this.isGenerating.set(false);
      return;
    }

    // Utiliser le service BrandingService pour générer les logos
    this.brandingService
      .generateLogoConcepts(
        this.projectId()!,
        selectedColor,
        selectedTypography
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Logos generated successfully:', response.logos);

          // Ensure each logo has a unique ID
          const logosWithUniqueIds = response.logos.map((logo: LogoModel, index: number) => ({
            ...logo,
            id: logo.id || `logo-${Date.now()}-${index}`
          }));

          console.log('Logos with unique IDs:', logosWithUniqueIds);

          // Update state with generated logos
          this.generatedLogos.set(logosWithUniqueIds);
          this.logosGenerated.emit(logosWithUniqueIds);

          // Update generation state
          this.isGenerating.set(false);
          this.generationProgress.set(100);
          this.currentStep.set('Generation completed!');
        },
        error: (error) => {
          console.error('Error in logo generation:', error);
          this.error.set('Failed to generate logos. Please try again.');
          this.isGenerating.set(false);
        },
      });
  }

  // Méthode supprimée car dupliquée

  private simulateProgress(): void {
    const steps = [
      { progress: 10, step: 'Analyzing color palette and typography...' },
      { progress: 25, step: 'Generating design concepts...' },
      { progress: 45, step: 'Creating logo variations...' },
      { progress: 65, step: 'Refining designs...' },
      { progress: 80, step: 'Optimizing SVG graphics...' },
      { progress: 95, step: 'Finalizing logos...' },
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length && this.isGenerating()) {
        const currentStepData = steps[currentStepIndex];
        this.generationProgress.set(currentStepData.progress);
        this.currentStep.set(currentStepData.step);
        currentStepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 15000); // Update every 15 seconds
  }

  /**
   * Method to retry logo generation in case of failure
   */
  protected retryGeneration(): void {
    // Reset error state
    this.error.set(null);
    this.hasStartedGeneration.set(false);
    this.generatedLogos.set([]);
    this.generationProgress.set(0);

    // Restart generation
    this.startLogoGeneration();
  }
}
