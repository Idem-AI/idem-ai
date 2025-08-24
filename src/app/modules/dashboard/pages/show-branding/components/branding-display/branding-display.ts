import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnInit,
} from '@angular/core';
import { BrandIdentityModel } from '../../../../models/brand-identity.model';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { CookieService } from '../../../../../../shared/services/cookie.service';
import { PdfViewer } from '../../../../../../shared/components/pdf-viewer/pdf-viewer';

@Component({
  selector: 'app-branding-display',
  standalone: true,
  imports: [PdfViewer],
  templateUrl: './branding-display.html',
  styleUrl: './branding-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandingDisplayComponent implements OnInit {
  readonly branding = input.required<BrandIdentityModel | null>();

  private readonly brandingService = inject(BrandingService);
  private readonly cookieService = inject(CookieService);

  protected readonly pdfSrc = signal<string | null>(null);
  protected readonly isDownloadingPdf = signal<boolean>(false);
  protected readonly pdfError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (this.branding()?.sections) {
      await this.loadPdfFromBackend();
    }
  }

  /**
   * Load PDF from backend endpoint
   */
  private async loadPdfFromBackend(): Promise<void> {
    try {
      this.isDownloadingPdf.set(true);
      this.pdfError.set(null);

      const projectId = this.cookieService.get('projectId');
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      // Download PDF blob from backend
      const pdfBlob = await this.brandingService
        .downloadBrandingPdf(projectId)
        .toPromise();

      if (pdfBlob) {
        // Create object URL for PDF viewer
        const pdfUrl = URL.createObjectURL(pdfBlob);
        this.pdfSrc.set(pdfUrl);
      }
    } catch (error: any) {
      console.error('Error loading PDF from backend:', error);
      this.pdfError.set(
        error.message || 'Failed to load PDF. Please try again.'
      );
    } finally {
      this.isDownloadingPdf.set(false);
    }
  }

  protected async regeneratePdf(): Promise<void> {
    await this.loadPdfFromBackend();
  }

  protected downloadPdf(): void {
    if (this.pdfSrc()) {
      const link = document.createElement('a');
      link.href = this.pdfSrc()!;
      link.download = 'branding-guide.pdf';
      link.click();
    }
  }
}
