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
import {
  ColorModel,
  TypographyModel,
} from '../../../../models/brand-identity.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-logo-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: './logo-selection.html',
  styleUrl: './logo-selection.css',
})
export class LogoSelectionComponent implements OnInit, OnDestroy {
  // Services
  private readonly destroy$ = new Subject<void>();

  // Inputs
  readonly projectId = input<string>();
  readonly selectedColor = input<ColorModel>();
  readonly selectedTypography = input<TypographyModel>();
  readonly logos = input<LogoModel[]>();
  readonly selectedLogo = input<string>();

  // Outputs
  readonly logoSelected = output<string>();
  readonly logosGenerated = output<LogoModel[]>();

  // Internal state
  protected readonly isGenerating = signal(false);
  protected readonly generatedLogos = signal<LogoModel[]>([]);
  protected readonly generationProgress = signal(0);
  protected readonly currentStep = signal('');
  protected readonly estimatedTime = signal('2-3 minutes');
  protected readonly hasStartedGeneration = signal(false);

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
    // Auto-start generation if we have the required inputs and no logos yet
    const hasRequiredInputs =
      this.projectId() && this.selectedColor() && this.selectedTypography();
    const hasNoLogos = !this.logos() || this.logos()?.length === 0;

    if (hasRequiredInputs && hasNoLogos && !this.hasStartedGeneration()) {
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

  protected startLogoGeneration(): void {
    if (this.isGenerating() || this.hasStartedGeneration()) {
      return;
    }

    this.hasStartedGeneration.set(true);
    this.isGenerating.set(true);
    this.currentStep.set('Initializing logo generation...');
    this.generationProgress.set(0);

    // Simulate progress updates
    this.simulateProgress();

    // Start actual generation (mock for now - will be replaced with actual service call)
    setTimeout(() => {
      // Mock logo generation for demonstration
      const mockLogos: LogoModel[] = [
        {
          id: 'mock-1',
          name: 'Generated Logo 1',
          concept: 'Modern and minimalist design',
          svg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#3B82F6"/></svg>',
          colors: ['#3B82F6', '#1E40AF'],
          fonts: ['Inter', 'Roboto'],
        },
        {
          id: 'mock-2',
          name: 'Generated Logo 2',
          concept: 'Creative and dynamic approach',
          svg: '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#10B981"/></svg>',
          colors: ['#10B981', '#059669'],
          fonts: ['Poppins', 'Open Sans'],
        },
        {
          id: 'mock-2',
          name: 'Generated Logo 2',
          concept: 'Creative and dynamic approach',
          svg: '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#10B981"/></svg>',
          colors: ['#10B981', '#059669'],
          fonts: ['Poppins', 'Open Sans'],
        },
        {
          id: 'mock-2',
          name: 'Generated Logo 2',
          concept: 'Creative and dynamic approach',
          svg: '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#10B981"/></svg>',
          colors: ['#10B981', '#059669'],
          fonts: ['Poppins', 'Open Sans'],
        },
      ];

      this.generatedLogos.set(mockLogos);
      this.logosGenerated.emit(mockLogos);
      this.isGenerating.set(false);
      this.generationProgress.set(100);
      this.currentStep.set('Generation completed!');
    }, 3000); // 30 seconds for demo

    // TODO: Replace with actual BrandingService call when available
  }

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

  protected retryGeneration(): void {
    this.hasStartedGeneration.set(false);
    this.generatedLogos.set([]);
    this.generationProgress.set(0);
    this.startLogoGeneration();
  }
}
