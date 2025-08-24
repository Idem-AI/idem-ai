import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  OnInit,
} from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { BusinessPlanModel } from '../../../../models/businessPlan.model';
import { BusinessPlanService } from '../../../../services/ai-agents/business-plan.service';
import { CookieService } from '../../../../../../shared/services/cookie.service';

@Component({
  selector: 'app-business-plan-display',
  standalone: true,
  imports: [PdfViewerModule],
  templateUrl: './business-plan-display.html',
  styleUrl: './business-plan-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanDisplayComponent implements OnInit {
  readonly businessPlan = input.required<BusinessPlanModel | null>();
  
  private readonly businessPlanService = inject(BusinessPlanService);
  private readonly cookieService = inject(CookieService);
  
  protected readonly pdfSrc = signal<string | null>(null);
  protected readonly isDownloadingPdf = signal<boolean>(false);
  protected readonly pdfError = signal<string | null>(null);
  protected readonly totalPages = signal<number>(0);
  protected readonly currentPage = signal<number>(1);

  async ngOnInit(): Promise<void> {
    if (this.businessPlan()?.sections) {
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
      const pdfBlob = await this.businessPlanService.downloadBusinessPlanPdf(projectId).toPromise();
      
      if (pdfBlob) {
        // Create object URL for PDF viewer
        const pdfUrl = URL.createObjectURL(pdfBlob);
        this.pdfSrc.set(pdfUrl);
      }
      
    } catch (error: any) {
      console.error('Error loading PDF from backend:', error);
      this.pdfError.set(error.message || 'Failed to load PDF. Please try again.');
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
      link.download = 'business-plan.pdf';
      link.click();
    }
  }

  protected onPdfLoadComplete(pdf: any): void {
    this.totalPages.set(pdf.numPages);
  }

  protected onPageRendered(event: any): void {
    this.currentPage.set(event.pageNumber);
  }
}
