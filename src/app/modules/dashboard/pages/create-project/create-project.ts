import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectModel } from '../../models/project.model';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';

import { initEmptyObject } from '../../../../utils/init-empty-object';
import CreateProjectDatas, { DevelopmentPhase, SelectElement } from './datas';

// Import new components
import { ProjectDescriptionComponent } from './components/project-description/project-description';
import { ProjectDetailsComponent } from './components/project-details/project-details';
import { LogoSelectionComponent } from './components/logo-selection/logo-selection';
import { ColorSelectionComponent } from './components/color-selection/color-selection';
import { TypographySelectionComponent } from './components/typography-selection/typography-selection';
import { ProjectSummaryComponent } from './components/project-summary/project-summary';
import { LogoModel } from '../../models/logo.model';
import { ColorModel, TypographyModel } from '../../models/brand-identity.model';
import { BrandingService } from '../../services/ai-agents/branding.service';
import { CookieService } from '../../../../shared/services/cookie.service';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    SkeletonModule,
    ProjectDescriptionComponent,
    ProjectDetailsComponent,
    LogoSelectionComponent,
    ColorSelectionComponent,
    TypographySelectionComponent,
    ProjectSummaryComponent,
  ],
  templateUrl: './create-project.html',
  styleUrl: './create-project.css',
})
export class CreateProjectComponent implements OnInit {
  // Angular injected services
  protected readonly projectService = inject(ProjectService);
  protected readonly router = inject(Router);
  protected readonly brandingService = inject(BrandingService);
  protected readonly cookieService = inject(CookieService);

  // Step management
  protected readonly isLoaded = signal(false);
  protected readonly currentStepIndex = signal<number>(0);
  protected readonly selectedTabIndex = signal<number>(0);
  protected readonly brandingError = signal<string | null>(null);

  // Simplified step structure with all necessary information
  protected readonly steps = [
    { id: 'description', title: 'Project Description', active: signal(true) },
    { id: 'details', title: 'Project Details', active: signal(false) },
    { id: 'colors', title: 'Color Selection', active: signal(false) },
    { id: 'typography', title: 'Typography', active: signal(false) },
    { id: 'logo', title: 'Logo Selection', active: signal(false) },
    { id: 'summary', title: 'Summary', active: signal(false) },
  ];

  // ViewChild references
  @ViewChild('projectDescription') readonly projectDescription!: ElementRef;
  @ViewChild('projectDetails') readonly projectDetails!: ElementRef;
  @ViewChild('logoSelection') readonly logoSelection!: ElementRef;
  @ViewChild('colorSelection') readonly colorSelection!: ElementRef;
  @ViewChild('typographySelection') readonly typographySelection!: ElementRef;
  @ViewChild('summarySelection') readonly summarySelection!: ElementRef;

  // Project model
  protected project = signal<ProjectModel>(initEmptyObject<ProjectModel>());


  protected selectedTeamSize: SelectElement | undefined;
  protected selectedTarget: SelectElement | undefined;
  protected selectedScope: SelectElement | undefined;
  protected selectedBudget: SelectElement | undefined;
  protected selectedConstraints = signal<SelectElement[]>([]);
  protected visible = signal<boolean>(false);
  protected privacyPolicyAccepted = signal<boolean>(false);
  protected termsOfServiceAccepted = signal<boolean>(false);
  protected betaPolicyAccepted = signal<boolean>(false);
  protected marketingConsentAccepted = signal<boolean>(false);

  // Visual identity selections
  logos: LogoModel[] = [];
  protected colorModels: ColorModel[] = [];
  protected typographyModels: TypographyModel[] = [];
  protected selectedLogo = '';
  protected selectedColor = '';
  protected selectedTypography = '';

  protected groupedProjectTypes: SelectElement[] =
    CreateProjectDatas.groupedProjectTypes;
  protected groupedTargets: SelectElement[] = CreateProjectDatas.groupedTargets;
  protected groupedScopes: SelectElement[] = CreateProjectDatas.groupedScopes;

  protected markdown = '';

  constructor() {}

  /**
   * Scrolls to the specified section element with a smooth animation
   * @param section ElementRef to scroll to
   */
  private scrollToSection(section: ElementRef): void {
    // No longer blocking scroll
    setTimeout(() => {
      if (section) {
        section.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);
  }

  /**
   * Adds a transition direction class based on navigation direction
   * @param fromIndex Previous step index
   * @param toIndex New step index
   * @returns CSS class for the appropriate animation direction
   */
  protected getTransitionClass(fromIndex: number, toIndex: number): string {
    if (fromIndex < toIndex) {
      return 'animate-slideInRight';
    } else if (fromIndex > toIndex) {
      return 'animate-slideInLeft';
    }
    return 'animate-fadeIn';
  }

  ngOnInit(): void {
    console.log('project', this.project);
  }

  /**
   * Auto-resize textarea based on content
   * @param event Input event from textarea
   */
  protected autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';

    const newHeight = Math.min(textarea.scrollHeight, 400);
    textarea.style.height = newHeight + 'px';
  }

  /**
   * Gets the element reference for a step by index
   */
  protected getElementForStep(stepIndex: number): ElementRef {
    const step = this.steps[stepIndex];
    if (!step) return this.projectDescription;

    switch (step.id) {
      case 'description':
        return this.projectDescription;
      case 'details':
        return this.projectDetails;
      case 'colors':
        return this.colorSelection;
      case 'logo':
        return this.logoSelection;
      case 'typography':
        return this.typographySelection;
      case 'summary':
        return this.summarySelection;
      default:
        return this.projectDescription;
    }
  }

  /**
   * Navigates to a specific step with animation
   * @param index The index of the step to navigate to
   */
  protected navigateToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      const previousIndex = this.currentStepIndex();

      // Skip if already at this step
      if (previousIndex === index) return;

      // Deactivate all steps
      this.steps.forEach((step) => step.active.set(false));

      // Activate the target step
      this.steps[index].active.set(true);
      this.currentStepIndex.set(index);

      // Save project to cookies after step change
      try {
        this.cookieService.set('draftProject', JSON.stringify(this.project));
        console.log('Project data updated in cookies after step navigation.');
      } catch (e) {
        console.error('Error updating project data in cookies:', e);
      }

      // Scroll to the section with a slight delay for better animation
      setTimeout(() => {
        this.scrollToSection(this.getElementForStep(index).nativeElement);
      }, 50);

      // Track this navigation for analytics (optional)
      console.log(
        `Navigation from ${this.steps[previousIndex]?.id} to ${this.steps[index]?.id}`
      );
    }
  }

  private generateProjectId(): string {
    console.log('Generating project ID...');
    console.log('Project name:', this.project()?.name);
    if (!this.project() || !this.project()?.name) {
      return '';
    }
    const projectName = this.project()
      .name.trim()
      .toLowerCase()
      .replace(/\s/g, '-');
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    return `${projectName}-${date}`;
  }

  /**
   * Handles navigation to the next step in the project creation flow
   */
  protected goToNextStep(): void {
    const currentStep = this.currentStepIndex();
    const nextIndex = currentStep + 1;

    if (nextIndex === 2) {
      // Corresponds to 'Color Selection' step (index 2)
      // Generate colors and typography first
      this.project.update((project) => ({
        ...project,
        id: this.generateProjectId(),
      }));
      console.log('Project ID generated:', this.project().id);
      if (nextIndex < this.steps.length) {
        this.isLoaded.set(true);
        this.brandingError.set(null); // Clear previous error

        this.brandingService
          .generateColorsAndTypography(this.project())
          .subscribe({
            next: (brandingData) => {
              console.log(
                'Colors and typography generated successfully:',
                brandingData
              );
              this.colorModels = brandingData.colors;
              this.typographyModels = brandingData.typography;
              console.log('Color models:', this.colorModels);
              console.log('Typography models:', this.typographyModels);
              // Update project with generated colors and typography
              this.project.update((project) => ({
                ...project,
                analysisResultModel: {
                  ...project.analysisResultModel,
                  branding: {
                    logo: {
                      id: 'placeholder',
                      name: 'Placeholder Logo',
                      svg: '',
                      concept: 'Logo will be generated after color and typography selection',
                      colors: [],
                      fonts: []
                    }, // Placeholder logo - will be replaced when generated
                    generatedLogos: [],
                    colors: this.colorModels[0],
                    generatedColors: brandingData.colors,
                    typography: this.typographyModels[0],
                    generatedTypography: brandingData.typography,
                    sections: [],
                  },
                },
              }));
              this.isLoaded.set(false);
              this.navigateToStep(nextIndex);
            },
            error: (err) => {
              console.error('Error generating colors and typography:', err);
              this.brandingError.set(
                'Failed to generate colors and typography. If the problem persists, please try again later.'
              );
              this.isLoaded.set(false);
              // Do not navigate to the next step on error
            },
          });
      }
    } else if (nextIndex === 4) {
      // Corresponds to 'Logo Selection' step (index 4)
      // Generate logos with selected color and typography
      const selectedColor = this.colorModels.find((color) => color.id === this.selectedColor) || this.colorModels[0];
      const selectedTypography = this.typographyModels.find((typography) => typography.id === this.selectedTypography) || this.typographyModels[0];
      
      if (selectedColor && selectedTypography) {
        this.isLoaded.set(true);
        this.brandingError.set(null); // Clear previous error

        this.brandingService
          .generateLogo(this.project(), selectedColor, selectedTypography)
          .subscribe({
            next: (logoData) => {
              console.log(
                'Logos generated successfully:',
                logoData
              );
              this.logos = logoData.logos;
              
              // Update project with generated logos
              this.project.update((project) => ({
                ...project,
                analysisResultModel: {
                  ...project.analysisResultModel,
                  branding: {
                    ...project.analysisResultModel?.branding,
                    logo: logoData.logos[0],
                    generatedLogos: logoData.logos,
                  },
                },
              }));
              this.isLoaded.set(false);
              this.navigateToStep(nextIndex);
            },
            error: (err) => {
              console.error('Error generating logos:', err);
              this.brandingError.set(
                'Failed to generate logos. If the problem persists, please try again later.'
              );
              this.isLoaded.set(false);
              // Do not navigate to the next step on error
            },
          });
      } else {
        console.error('Selected color or typography not found');
        this.brandingError.set('Please select a color and typography before proceeding.');
      }
    } else {
      // For any other step, proceed as usual
      if (nextIndex < this.steps.length) {
        this.navigateToStep(nextIndex);
      }
    }
  }

  /**
   * Handles navigation to the previous step in the project creation flow
   */
  protected goToPreviousStep(): void {
    const prevIndex = this.currentStepIndex() - 1;
    if (prevIndex >= 0) {
      this.navigateToStep(prevIndex);
    }
  }

  /**
   * Handles privacy policy acceptance changes from the summary component
   */
  protected handlePrivacyPolicyChange(accepted: boolean): void {
    this.privacyPolicyAccepted.set(accepted);
  }

  /**
   * Handles terms of service acceptance changes from the summary component
   */
  protected handleTermsOfServiceChange(accepted: boolean): void {
    this.termsOfServiceAccepted.set(accepted);
  }

  /**
   * Handles beta policy acceptance changes from the summary component
   */
  protected handleBetaPolicyChange(accepted: boolean): void {
    this.betaPolicyAccepted.set(accepted);
  }

  /**
   * Handles marketing consent changes from the summary component
   */
  protected handleMarketingConsentChange(accepted: boolean): void {
    this.marketingConsentAccepted.set(accepted);
  }

  /**
   * Get loading title based on current step
   */
  protected getLoadingTitle(): string {
    const currentStep = this.currentStepIndex();
    switch (currentStep) {
      case 1: // Moving to step 2 (colors)
        return 'Generating Colors and Typography';
      case 3: // Moving to step 4 (logos)
        return 'Generating Logos';
      default:
        return 'Processing...';
    }
  }

  /**
   * Get loading message based on current step
   */
  protected getLoadingMessage(): string {
    const currentStep = this.currentStepIndex();
    switch (currentStep) {
      case 1: // Moving to step 2 (colors)
        return 'Creating personalized color palettes and typography options for your project.';
      case 3: // Moving to step 4 (logos)
        return 'This operation may take several minutes.';
      default:
        return 'Please wait while we process your request.';
    }
  }

  /**
   * Get loading sub-message based on current step
   */
  protected getLoadingSubMessage(): string {
    const currentStep = this.currentStepIndex();
    switch (currentStep) {
      case 1: // Moving to step 2 (colors)
        return 'Analyzing your project requirements...';
      case 3: // Moving to step 4 (logos)
        return 'Processing your design preferences...';
      default:
        return 'Working on your request...';
    }
  }

  // Method to create project with selected visual identity
  protected finalizeProjectCreation() {
    try {
      this.isLoaded.set(true);

      // Get the selected logo, color and typography objects without verification
      const selectedLogoObj =
        this.logos.find((logo) => logo.id === this.selectedLogo) ||
        this.logos[0];
      const selectedColorObj =
        this.colorModels.find((color) => color.id === this.selectedColor) ||
        this.colorModels[0];
      const selectedTypoObj =
        this.typographyModels.find(
          (typo) => typo.id === this.selectedTypography
        ) || this.typographyModels[0];

      // Single update operation to set all branding data at once
      this.project.update((project) => ({
        ...project,
        analysisResultModel: {
          ...(project.analysisResultModel || {}),
          branding: {
            logo: {
              id: selectedLogoObj.id,
              name: selectedLogoObj.name,
              svg: selectedLogoObj.svg,
              concept: selectedLogoObj.concept,
              variations: selectedLogoObj.variations,
              colors: selectedLogoObj.colors,
              fonts: selectedLogoObj.fonts,
            },
            colors: {
              id: selectedColorObj.id,
              name: selectedColorObj.name,
              url: selectedColorObj.url,
              colors: selectedColorObj.colors,
            },
            typography: {
              id: selectedTypoObj.id,
              name: selectedTypoObj.name,
              url: selectedTypoObj.url,
              primaryFont: selectedTypoObj.primaryFont,
              secondaryFont: selectedTypoObj.secondaryFont,
            },
            generatedLogos: this.logos,
            generatedColors: this.colorModels,
            generatedTypography: this.typographyModels,
            sections: [],
          },
        },
      }));

      // Create the project with all selected data
      this.projectService.createProject(this.project()).subscribe({
        next: (projectId: string) => {
          this.cookieService.set('projectId', projectId);
          this.router.navigate([`/console/dashboard`]);
        },
        error: (err) => {
          console.error('Error creating project:', err);
          this.isLoaded.set(false);
        },
      });
    } catch (e) {
      console.error('Error finalizing project:', e);
      this.isLoaded.set(false);
    }
  }

  protected goToThirdStep() {
    console.log('Project: ', this.project);
    this.visible.set(true);
    this.isLoaded.set(false);
  }

  /**
   * Handles constraint selection changes from the project details component
   * Updates the project model with selected constraints
   */
  protected onConstraintsChange(): void {
    const constraints = this.selectedConstraints();
    if (constraints && constraints.length > 0) {
      // Make sure to convert SelectElement[] to string[] if needed
      this.project().constraints = constraints.map(
        (item: SelectElement | string) =>
          typeof item === 'string' ? item : String(item)
      );
    } else {
      this.project().constraints = [];
    }
    // Log for debugging purposes
    console.log('Constraints updated:', this.selectedConstraints());
  }

  // Helper methods for template
  protected getSelectedLogo(): LogoModel | undefined {
    return this.logos.find((logo: LogoModel) => logo.id === this.selectedLogo);
  }

  protected getSelectedColor(): ColorModel | undefined {
    return this.colorModels.find(
      (color: ColorModel) => color.id === this.selectedColor
    );
  }

  protected getSelectedTypography(): TypographyModel | undefined {
    return this.typographyModels.find(
      (typo: TypographyModel) => typo.id === this.selectedTypography
    );
  }

  // Logo selection methods
  protected selectLogo(logoId: string) {
    this.selectedLogo = logoId;
    setTimeout(() => this.goToNextStep(), 300);
  }

  protected selectColor(colorId: string) {
    this.selectedColor = colorId;
    setTimeout(() => this.goToNextStep(), 300);
  }

  protected selectTypography(typographyId: string) {
    this.selectedTypography = typographyId;
    this.goToNextStep();
  }

  /**
   * Simplified helper for checking if a step is active by index
   */
  protected isStepActive(index: number): boolean {
    return this.steps[index]?.active() || false;
  }

  /**
   * Navigate to a specific step with loading animation
   * @param stepIndex The index of the step to navigate to
   * @param duration Optional transition duration (default: 400ms)
   */
  protected navigateWithLoading(stepIndex: number, duration = 400): void {
    // Show loading state
    this.isLoaded.set(true);

    // Apply a subtle transition effect
    const animationTiming = duration * 0.8;

    setTimeout(() => {
      this.navigateToStep(stepIndex);
      // Hide loading after animation completes
      setTimeout(() => {
        this.isLoaded.set(false);
      }, animationTiming);
    }, duration * 0.2);
  }
}
