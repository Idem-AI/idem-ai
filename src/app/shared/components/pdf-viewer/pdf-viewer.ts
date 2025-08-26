import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [NgxExtendedPdfViewerModule],
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

  protected onPdfLoadComplete(event: any): void {
    if (event && event.pagesCount) {
      this.totalPages.set(event.pagesCount);
    }
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  protected onRegenerateClick(): void {
    this.regenerateRequested.emit();
  }

  protected onDownloadClick(): void {
    this.downloadRequested.emit();
  }
}
