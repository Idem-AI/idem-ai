import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from '../../../../shared/services/cookie.service';
import { BrandingService } from '../../services/ai-agents/branding.service';
import { ProjectService } from '../../services/project.service';
import {
  BrandIdentityModel,
  ColorModel,
  TypographyModel,
} from '../../models/brand-identity.model';
import { LogoModel } from '../../models/logo.model';
import { ProjectModel } from '../../models/project.model';
import { BrandingDisplayComponent } from './components/branding-display/branding-display';
import { Loader } from '../../../../components/loader/loader';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-show-branding',
  standalone: true,
  imports: [CommonModule, BrandingDisplayComponent, Loader, PdfViewerModule],
  templateUrl: './show-branding.html',
  styleUrl: './show-branding.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowBrandingComponent implements OnInit {
  private readonly brandingService = inject(BrandingService);
  private readonly projectService = inject(ProjectService);
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);

  // Loading and error states
  protected readonly isLoading = signal<boolean>(true);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly isRetryable = signal<boolean>(false);

  // Project and branding data
  protected readonly projectIdFromCookie = signal<string | null>(null);
  protected readonly currentProject = signal<ProjectModel | null>(null);
  protected readonly existingBranding = signal<BrandIdentityModel | null>(null);
  protected readonly showBrandingGuide = signal<boolean>(false);

  // Computed properties for UI state
  protected readonly hasProjectData = computed(() => {
    const project = this.currentProject();
    return project !== null;
  });

  protected readonly hasBrandingGuide = computed(() => {
    return this.existingBranding() !== null;
  });

  protected readonly hasBrandingData = computed(() => {
    const branding = this.existingBranding();
    return (
      branding &&
      (branding.logo ||
        branding.generatedLogos?.length > 0 ||
        branding.colors ||
        branding.generatedColors?.length > 0 ||
        branding.typography ||
        branding.generatedTypography?.length > 0)
    );
  });
  ngOnInit(): void {
    const projectId = this.cookieService.get('projectId');
    this.projectIdFromCookie.set(projectId);

    if (projectId) {
      this.loadProjectData(projectId);
    } else {
      this.isLoading.set(false);
    }
  }

  /**
   * Load project data and branding information
   */
  private loadProjectData(projectId: string): void {
    // Load project data first
    this.projectService.getProjectById(projectId).subscribe({
      next: (project) => {
        this.currentProject.set(project);
        // Then load branding data
        this.loadExistingBranding(project!);
      },
      error: (err: any) => {
        console.error('Error loading project data:', err);
        this.hasError.set(true);
        this.errorMessage.set('Error loading project data.');
        this.isRetryable.set(true);
        this.isLoading.set(false);
      },
    });
  }
  /**
   * Load existing branding data for the project
   * Load branding data from project and check for PDF
   */
  private loadExistingBranding(project: ProjectModel): void {
    // Load branding data from project
    const brandingData = project.analysisResultModel?.branding;
    
    if (brandingData) {
      console.log('Branding data found in project:', brandingData);
      this.existingBranding.set(brandingData);
      
      // Also check for PDF if available
      this.checkForBrandingPdf(project.id!);
    } else {
      console.log('No branding data found in project');
      // Still check for PDF as fallback
      this.checkForBrandingPdf(project.id!);
    }
  }

  /**
   */
  private checkForBrandingPdf(projectId: string): void {
    this.brandingService.downloadBrandingPdf(projectId).subscribe({
      next: (pdfBlob: Blob) => {
        if (pdfBlob && pdfBlob.size > 0) {
          // PDF exists - add it to existing branding data
          const currentBranding = this.existingBranding();
          if (currentBranding) {
            // Update existing branding with PDF
            const updatedBranding = {
              ...currentBranding,
              pdfBlob: pdfBlob,
              sections: [
                ...currentBranding.sections,
                {
                  name: 'Brand Guide',
                  type: 'pdf',
                  data: 'PDF Available',
                  summary: 'Brand guide PDF document',
                }
              ]
            };
            this.existingBranding.set(updatedBranding);
          } else {
            // No existing branding data, create minimal one with PDF
            const brandingWithPdf: BrandIdentityModel = {
              id: `branding-${projectId}`,
              logo: {
                id: '',
                name: '',
                svg: '',
                concept: '',
                colors: [],
                fonts: [],
              },
              generatedLogos: [],
              colors: {
                id: '',
                name: '',
                url: '',
                colors: {
                  primary: '',
                  secondary: '',
                  accent: '',
                  background: '',
                  text: '',
                },
              },
              generatedColors: [],
              typography: {
                id: '',
                name: '',
                url: '',
                primaryFont: '',
                secondaryFont: '',
              },
              generatedTypography: [],
              sections: [
                {
                  name: 'Brand Guide',
                  type: 'pdf',
                  data: 'PDF Available',
                  summary: 'Brand guide PDF document',
                },
              ],
              createdAt: new Date(),
              updatedAt: new Date(),
              pdfBlob: pdfBlob,
            };
            this.existingBranding.set(brandingWithPdf);
          }
          console.log('Branding PDF found, adding to existing data');
          this.hasError.set(false);
        } else {
          console.log('No branding PDF found, keeping existing data');
          this.hasError.set(false);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading branding PDF:', err);
        if (err.message === 'DOWNLOAD_ERROR' || err.isRetryable === true) {
          this.hasError.set(true);
          this.isRetryable.set(true);
          this.errorMessage.set(
            'An error occurred while loading branding data.'
          );
          console.log(
            'Retryable error occurred, showing error message with retry button'
          );
        } else {
          console.log('No branding PDF found, keeping existing data if any');
          this.hasError.set(false);
        }

        // Don't set existingBranding to null if we already have data
        if (!this.existingBranding()) {
          this.existingBranding.set(null);
        }
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Navigate to branding generation page
   */
  protected generateBranding(): void {
    console.log('Navigating to branding generation page');
    this.router.navigate(['/console/branding/generate']);
  }

  /**
   * Show the branding guide (PDF)
   */
  protected viewBrandingGuide(): void {
    console.log('Showing branding guide');
    this.showBrandingGuide.set(true);
  }

  /**
   * Hide the branding guide and return to branding overview
   */
  protected hideBrandingGuide(): void {
    console.log('Hiding branding guide');
    this.showBrandingGuide.set(false);
  }

  /**
   * Retry loading the branding PDF
   */
  protected retryLoadBranding(): void {
    console.log('Retrying branding PDF load');
    const projectId = this.cookieService.get('projectId');
    if (projectId) {
      this.hasError.set(false);
      this.isLoading.set(true);
      this.loadProjectData(projectId);
    }
  }

  /**
   * Navigate to projects page
   */
  protected goToProjects(): void {
    console.log('Navigating to projects page');
    this.router.navigate(['/console/projects']);
  }
}
