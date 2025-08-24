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
  // Injected services
  private readonly brandingService = inject(BrandingService);
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);
  src = 'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf';
  // Signals for state management
  protected readonly isLoading = signal<boolean>(true);
  protected readonly existingBranding = signal<BrandIdentityModel | null>(null);
  protected readonly projectIdFromCookie = signal<string | null>(null);
  ngOnInit(): void {
    // Get project ID from cookies
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
        // No PDF found or error - show generate button
        console.log('No branding PDF found, showing generate button');
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
   * Navigate to projects page
   */
  protected goToProjects(): void {
    console.log('Navigating to projects page');
    this.router.navigate(['/console/projects']);
  }
}
