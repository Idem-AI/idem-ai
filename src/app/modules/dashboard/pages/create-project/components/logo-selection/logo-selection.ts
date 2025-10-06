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
import { LogoModel, LogoPreferences } from '../../../../models/logo.model';
import { CarouselComponent } from '../../../../../../shared/components/carousel/carousel.component';
import { LogoPreferencesComponent } from '../logo-preferences/logo-preferences.component';

import { Subject, takeUntil } from 'rxjs';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { ProjectModel } from '../../../../models/project.model';

@Component({
  selector: 'app-logo-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SafeHtmlPipe,
    CarouselComponent,
    LogoPreferencesComponent,
  ],
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
  protected readonly showPreferences = signal(true);
  protected readonly logoPreferences = signal<LogoPreferences | null>(null);

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
    return false; // Always show preferences first
  });

  protected readonly shouldShowPreferences = computed(() => {
    return this.showPreferences() && !this.logoPreferences();
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

    // Don't auto-start, wait for preferences
    if (hasNoLogos && !this.hasStartedGeneration()) {
      this.showPreferences.set(true);
    } else if (this.logos() && this.logos()!.length > 0) {
      this.showPreferences.set(false);
      this.generatedLogos.set(this.logos()!);
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

  protected onPreferencesSelected(preferences: LogoPreferences): void {
    console.log('Logo preferences selected:', preferences);
    this.logoPreferences.set(preferences);
    this.showPreferences.set(false);
    this.startLogoGeneration();
  }

  protected startLogoGeneration(): void {
    if (this.isGenerating() || this.hasStartedGeneration()) {
      return;
    }

    const preferences = this.logoPreferences();
    if (!preferences) {
      console.error('Logo preferences not set');
      return;
    }

    this.hasStartedGeneration.set(true);
    this.isGenerating.set(true);
    this.currentStep.set('Initializing logo generation...');
    this.generationProgress.set(0);

    this.simulateProgress();

    const project = this.project();
    const selectedColor = project?.analysisResultModel?.branding?.colors;
    const selectedTypography = project?.analysisResultModel?.branding?.typography;

    if (!selectedColor || !selectedTypography) {
      this.error.set(
        'Color and typography must be selected before generating logos.'
      );
      this.isGenerating.set(false);
      return;
    }

    this.brandingService
      .generateLogosWithPreferences(
        this.projectId()!,
        selectedColor,
        selectedTypography,
        preferences
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Logos generated successfully:', response.logos);

          const logosWithUniqueIds = response.logos.map((logo: LogoModel, index: number) => ({
            ...logo,
            id: logo.id || `logo-${Date.now()}-${index}`,
            type: preferences.type,
            customDescription: preferences.customDescription,
          }));

          console.log('Logos with unique IDs:', logosWithUniqueIds);

          this.generatedLogos.set(logosWithUniqueIds);
          this.logosGenerated.emit(logosWithUniqueIds);

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

  protected onCarouselItemChanged(logo: LogoModel): void {
    // Auto-select the logo when carousel navigation changes on mobile
    if (logo && logo.id) {
      this.selectLogo(logo.id);
    }
  }

  protected retryGeneration(): void {
    this.error.set(null);
    this.hasStartedGeneration.set(false);
    this.generatedLogos.set([]);
    this.generationProgress.set(0);
    this.logoPreferences.set(null);
    this.showPreferences.set(true);
  }
}
