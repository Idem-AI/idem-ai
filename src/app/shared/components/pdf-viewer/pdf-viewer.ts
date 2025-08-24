import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [PdfViewerModule],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewer {
  // Inputs
  readonly pdfSrc = input.required<string | null>();
  readonly isLoading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly showPagination = input<boolean>(true);
  readonly title = input<string>('PDF Document');

  // Outputs
  readonly regenerateRequested = output<void>();
  readonly downloadRequested = output<void>();

  // Internal state
  protected readonly totalPages = signal<number>(0);
  protected readonly currentPage = signal<number>(1);

  protected onPdfLoadComplete(pdf: any): void {
    this.totalPages.set(pdf.numPages);
  }

  protected onPageRendered(event: any): void {
    this.currentPage.set(event.pageNumber);
  }

  protected onRegenerateClick(): void {
    this.regenerateRequested.emit();
  }

  protected onDownloadClick(): void {
    this.downloadRequested.emit();
  }
}
