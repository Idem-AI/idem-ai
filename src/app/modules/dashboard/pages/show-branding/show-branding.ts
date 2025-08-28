import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from '../../../../shared/services/cookie.service';
import { BrandingService } from '../../services/ai-agents/branding.service';
import { BrandIdentityModel } from '../../models/brand-identity.model';
import { BrandingDisplayComponent } from './components/branding-display/branding-display';
import { Loader } from '../../../../components/loader/loader';
import { PdfViewerModule } from 'ng2-pdf-viewer'; // <- import PdfViewerModule

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
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly existingBranding = signal<BrandIdentityModel | null>(null);
  protected readonly projectIdFromCookie = signal<string | null>(null);
  protected readonly hasError = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly isRetryable = signal<boolean>(false);
  ngOnInit(): void {
    const projectId = this.cookieService.get('projectId');
    this.projectIdFromCookie.set(projectId);

    if (projectId) {
      this.loadExistingBranding(projectId);
    } else {
      this.isLoading.set(false);
    }
  }

  /**
   * Load existing branding PDF for the project
   * If PDF exists, show display component, otherwise show generation component
   */
  private loadExistingBranding(projectId: string): void {
    this.brandingService.downloadBrandingPdf(projectId).subscribe({
      next: (pdfBlob: Blob) => {
        if (pdfBlob && pdfBlob.size > 0) {
          // PDF exists - create a mock BrandIdentityModel to pass to display component
          const brandingWithPdf: BrandIdentityModel = {
            id: `branding-${projectId}`,
            logo: { id: '', name: '', svg: '', concept: '', colors: [], fonts: [] },
            generatedLogos: [],
            colors: { id: '', name: '', url: '', colors: { primary: '', secondary: '', accent: '', background: '', text: '' } },
            generatedColors: [],
            typography: { id: '', name: '', url: '', primaryFont: '', secondaryFont: '' },
            generatedTypography: [],
            sections: [{ 
              name: 'Branding Guide', 
              type: 'pdf',
              data: 'PDF Available',
              summary: 'Branding guide PDF document'
            }],
            createdAt: new Date(),
            updatedAt: new Date(),
            pdfBlob: pdfBlob // Add the PDF blob to the model
          };
          this.existingBranding.set(brandingWithPdf);
          console.log('Branding PDF found, showing display component');
        } else {
          // Empty PDF - show generate button
          console.log('Empty PDF found, showing generate button');
          this.existingBranding.set(null);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading branding PDF:', err);
        
        // Check if this is a retryable error (other errors except 404)
        if (err.message === 'DOWNLOAD_ERROR' || (err.isRetryable === true)) {
          this.hasError.set(true);
          this.isRetryable.set(true);
          this.errorMessage.set('Une erreur est survenue lors du téléchargement.');
          console.log('Retryable error occurred, showing error message with retry button');
        } else {
          // 404 or other non-retryable errors - show generate button
          console.log('PDF not found (404) or non-retryable error, showing generate button');
          this.hasError.set(false);
        }
        
        this.existingBranding.set(null);
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
   * Retry loading the branding PDF
   */
  protected retryLoadBranding(): void {
    console.log('Retrying branding PDF load');
    const projectId = this.projectIdFromCookie();
    if (projectId) {
      this.hasError.set(false);
      this.isLoading.set(true);
      this.loadExistingBranding(projectId);
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
