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
  protected readonly currentStepIndex = signal<number>(0);
  protected readonly selectedTabIndex = signal<number>(0);

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
  
  // Loading state
  protected isLoaded = signal<boolean>(false);

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
      if (section?.nativeElement) {
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
        const elementRef = this.getElementForStep(index);
        if (elementRef) {
          this.scrollToSection(elementRef);
        }
      }, 50);

      // Track this navigation for analytics (optional)
      console.log(
        `Navigation from ${this.steps[previousIndex]?.id} to ${this.steps[index]?.id}`
      );
    }
  }

  /**
   * Handles navigation to the next step in the project creation flow
   */
  protected goToNextStep(): void {
    const currentStep = this.currentStepIndex();
    const nextIndex = currentStep + 1;

    if (nextIndex === 2) {
      // Color selection component will handle its own generation
      if (nextIndex < this.steps.length) {
        this.navigateToStep(nextIndex);
      }
    } else if (nextIndex === 3) {
      // Typography selection - we already have typography data from color step
      // No need to generate again, just show the 4-second loader
      if (nextIndex < this.steps.length) {
        this.navigateToStep(nextIndex);
      }
    } else if (nextIndex === 4) {
      // Logo selection component will handle its own generation
      if (nextIndex < this.steps.length) {
        this.navigateToStep(nextIndex);
      }
    } else {
      // For any other step, proceed as usual
      if (nextIndex < this.steps.length) {
        console.log('st51ProjectId: ', this.project().id);
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


  // Method to create project with selected visual identity
  protected finalizeProjectCreation() {
    this.cookieService.set('projectId', this.project().id!);
    this.router.navigate([`/console/dashboard`]);
  }

  protected goToThirdStep() {
    console.log('Project: ', this.project);
    this.visible.set(true);
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

    // Step 2: Generate variations for the selected logo
    const selectedLogoObj = this.logos.find((logo) => logo.id === logoId);
    if (selectedLogoObj && selectedLogoObj.svg && this.project().id) {
      console.log(
        'Generating variations for selected logo:',
        selectedLogoObj.name
      );

      // Logo selection component will handle variations generation

      this.brandingService
        .generateLogoVariations(selectedLogoObj, this.project())
        .subscribe({
          next: (variationsData) => {
            console.log(
              'Logo variations generated successfully:',
              variationsData
            );

            // Update the selected logo with its variations
            const updatedLogo = {
              ...selectedLogoObj,
              variations: variationsData.variations,
            };

            // Update the logos array with variations
            this.logos = this.logos.map((logo) =>
              logo.id === logoId ? updatedLogo : logo
            );

            // Update project with logo variations
            this.project.update((project) => ({
              ...project,
              analysisResultModel: {
                ...project.analysisResultModel,
                branding: {
                  ...project.analysisResultModel?.branding,
                  logo: updatedLogo,
                  generatedLogos: this.logos,
                },
              },
            }));

            setTimeout(() => this.goToNextStep(), 300);
          },
          error: (err) => {
            console.error('Error generating logo variations:', err);
            console.error('Logo variations generation failed');
            // Do NOT proceed to next step on error
          },
        });
    } else {
      // If no SVG or project ID, proceed without variations
      console.warn(
        'No SVG data or project ID found, proceeding without variations'
      );
      setTimeout(() => this.goToNextStep(), 300);
    }
  }

  /**
   * Handles colors generated from the color-selection component
   * @param colors The generated color models
   */
  protected handleColorsGenerated(colors: ColorModel[]): void {
    this.colorModels = colors;
    
    // Make sure we have at least one color to set as the selected color
    if (colors && colors.length > 0) {
      // Update project with the generated colors
      this.project.update((project) => ({
        ...project,
        analysisResultModel: {
          ...project.analysisResultModel,
          branding: {
            ...project.analysisResultModel?.branding,
            // Set the first color as the selected color
            colors: colors[0],
            // Store all generated colors
            generatedColors: colors,
          },
        },
      }));
    }
  }
  
  /**
   * Handles colors and typography generated together from the color-selection component
   * @param data Object containing colors and typography arrays
   */
  protected handleColorsAndTypographyGenerated(data: {colors: ColorModel[], typography: TypographyModel[]}): void {
    // Update color models
    this.colorModels = data.colors;
    
    // Update typography models
    this.typographyModels = data.typography;
    
    // Make sure we have at least one color and typography to set as selected
    if (data.colors?.length > 0 && data.typography?.length > 0) {
      // Update project with both colors and typography
      this.project.update((project) => ({
        ...project,
        analysisResultModel: {
          ...project.analysisResultModel,
          branding: {
            ...project.analysisResultModel?.branding,
            // Set the first color as the selected color
            colors: data.colors[0],
            // Store all generated colors
            generatedColors: data.colors,
            // Set the first typography as the selected typography
            typography: data.typography[0],
            // Store all generated typography options
            generatedTypography: data.typography,
          },
        },
      }));
      
      // Set the first items as selected by default
      if (!this.selectedColor && data.colors.length > 0) {
        this.selectedColor = data.colors[0].id;
      }
      
      if (!this.selectedTypography && data.typography.length > 0) {
        this.selectedTypography = data.typography[0].id;
      }
    }
    
    console.log('Colors and typography updated in project:', data);
  }
  
  protected selectColor(colorId: string) {
    this.selectedColor = colorId;
    // Removed auto-navigation - user must click Next button
  }

  protected selectTypography(typographyId: string) {
    this.selectedTypography = typographyId;
    // Removed auto-navigation - user must click Next button
  }

  /**
   * Simplified helper for checking if a step is active by index
   */
  protected isStepActive(index: number): boolean {
    return this.steps[index]?.active() || false;
  }


}
