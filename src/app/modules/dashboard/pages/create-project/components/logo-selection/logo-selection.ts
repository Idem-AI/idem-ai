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

import { Subject, takeUntil } from 'rxjs';
import { BrandingService } from '../../../../services/ai-agents/branding.service';

@Component({
  selector: 'app-logo-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
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

  // Outputs
  readonly logoSelected = output<string>();
  readonly logosGenerated = output<LogoModel[]>();
  readonly nextStep = output<void>();

  // Internal state
  protected readonly isGenerating = signal(false);
  protected readonly generatedLogos = signal<LogoModel[]>([]);
  protected readonly generationProgress = signal(0);
  protected readonly currentStep = signal('');
  protected readonly estimatedTime = signal('2-3 minutes');
  protected readonly hasStartedGeneration = signal(false);
  protected readonly error = signal<string | null>(null);

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

  protected readonly shouldShowInitialPrompt = computed(() => {
    return (
      !this.shouldShowLoader() &&
      !this.shouldShowLogos() &&
      !this.hasStartedGeneration()
    );
  });

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
    this.logoSelected.emit(logoId);
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
    this.currentStep.set('Initialisation de la génération de logo...');
    this.generationProgress.set(0);

    // Simuler les mises à jour de progression
    this.simulateProgress();

    // Utiliser le service BrandingService pour générer les logos
    this.brandingService
      .generateLogoConcepts(this.projectId()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Logos générés avec succès:', response.logos);

          // Mettre à jour l'état avec les logos générés
          this.generatedLogos.set(response.logos);
          this.logosGenerated.emit(response.logos);

          // Mettre à jour l'état de génération
          this.isGenerating.set(false);
          this.generationProgress.set(100);
          this.currentStep.set('Génération terminée!');
        },
        error: (error) => {
          console.error('Erreur lors de la génération des logos:', error);
          this.error.set(
            'Échec de la génération des logos. Veuillez réessayer.'
          );
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
   * Méthode pour réessayer la génération de logos en cas d'échec
   */
  protected retryGeneration(): void {
    // Réinitialiser l'état d'erreur
    this.error.set(null);
    this.hasStartedGeneration.set(false);
    this.generatedLogos.set([]);
    this.generationProgress.set(0);

    // Relancer la génération
    this.startLogoGeneration();
  }
}
