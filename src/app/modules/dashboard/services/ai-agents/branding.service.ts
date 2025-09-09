import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  BrandIdentityModel,
  ColorModel,
  TypographyModel,
} from '../../models/brand-identity.model';
import { ProjectModel } from '../../models/project.model';
import { LogoModel } from '../../models/logo.model';
import { SSEService } from '../../../../shared/services/sse.service';
import {
  SSEStepEvent,
  SSEConnectionConfig,
} from '../../../../shared/models/sse-step.model';

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private readonly apiUrl = `${environment.services.api.url}/project/brandings`;
  private readonly http = inject(HttpClient);
  private readonly sseService = inject(SSEService);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Close SSE connection
   */
  closeSSEConnection(): void {
    this.sseService.closeConnection('branding');
  }

  /**
   * Create a new branding item using Server-Sent Events for real-time updates
   * @param projectId Project ID
   * @returns Observable with SSE events
   */
  createBrandIdentityModel(projectId: string): Observable<SSEStepEvent> {
    console.log('Starting branding generation with SSE...');

    // Close any existing SSE connection
    this.closeSSEConnection();

    const config: SSEConnectionConfig = {
      url: `${this.apiUrl}/generate/${projectId}`,
      keepAlive: true,
      reconnectionDelay: 1000,
    };

    return this.sseService.createConnection(config, 'branding');
  }

  /**
   * Cancel ongoing SSE connection
   */
  cancelGeneration(): void {
    this.sseService.cancelGeneration('branding');
  }

  generateColorsAndTypography(project: ProjectModel): Observable<{
    colors: ColorModel[];
    typography: TypographyModel[];
    project: ProjectModel;
  }> {
    console.log('Generating colors and typography...');
    console.log('Project:', project);
    return this.http
      .post<{
        colors: ColorModel[];
        typography: TypographyModel[];
        project: ProjectModel;
      }>(`${this.apiUrl}/generate/colors-typography`, { project })
      .pipe(
        tap((response) =>
          console.log('generateColorsAndTypography response:', response)
        ),
        catchError((error) => {
          console.error('Error in generateColorsAndTypography:', error);
          throw error;
        })
      );
  }

  /**
   * Step 1: Generate 4 main logo concepts with text and main SVG
   * This replaces the old generateLogo method
   */
  generateLogoConcepts(projectId: string): Observable<{
    logos: LogoModel[];
  }> {
    console.log(
      'Generating logo concepts with selected color and typography...'
    );
    console.log('Project ID:', projectId);
    return this.http
      .post<{
        logos: LogoModel[];
      }>(`${this.apiUrl}/generate/logo-concepts/${projectId}`, {})
      .pipe(
        tap((response) =>
          console.log('generateLogoConcepts response:', response)
        ),
        catchError((error) => {
          console.error('Error in generateLogoConcepts:', error);
          throw error;
        })
      );
  }

  /**
   * Step 2: Generate variations (without text, light/dark/mono) for selected logo
   * Called only when user selects a specific logo concept
   */
  generateLogoVariations(
    selectedLogo: LogoModel,
    project: ProjectModel
  ): Observable<{
    variations: {
      lightBackground?: string;
      darkBackground?: string;
      monochrome?: string;
    };
  }> {
    console.log('Generating logo variations for selected logo...');
    console.log('Selected Logo:', selectedLogo.id);
    console.log('Project:', project);
    return this.http
      .post<{
        variations: {
          lightBackground?: string;
          darkBackground?: string;
          monochrome?: string;
        };
      }>(`${this.apiUrl}/generate/logo-variations/${project.id}`, {
        selectedLogo: selectedLogo,
      })
      .pipe(
        tap((response) =>
          console.log('generateLogoVariations response:', response)
        ),
        catchError((error) => {
          console.error('Error in generateLogoVariations:', error);
          throw error;
        })
      );
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use generateLogoConcepts instead
   */
  generateLogo(project: ProjectModel): Observable<{
    logos: LogoModel[];
  }> {
    console.warn(
      'generateLogo is deprecated, use generateLogoConcepts instead'
    );
    // Note: This now requires projectId, so we'll need to extract it from project
    if (!project.id) {
      throw new Error('Project ID is required for logo generation');
    }
    return this.generateLogoConcepts(project.id!);
  }

  getBrandIdentityModels(projectId: string): Observable<BrandIdentityModel[]> {
    return this.http
      .get<BrandIdentityModel[]>(`${this.apiUrl}?projectId=${projectId}`)
      .pipe(
        tap((response) =>
          console.log('getBrandIdentityModels response:', response)
        ),
        catchError((error) => {
          console.error('Error in getBrandIdentityModels:', error);
          throw error;
        })
      );
  }

  getBrandIdentity(
    projectId: string,
    brandingId: string
  ): Observable<BrandIdentityModel> {
    return this.http
      .get<BrandIdentityModel>(`${this.apiUrl}/${projectId}/${brandingId}`)
      .pipe(
        tap((response) =>
          console.log('getBrandIdentityModelById response:', response)
        ),
        catchError((error) => {
          console.error(
            `Error in getBrandIdentityModelById for ID ${projectId}:`,
            error
          );
          throw error;
        })
      );
  }
  getBrandIdentityModelById(projectId: string): Observable<BrandIdentityModel> {
    return this.http.get<BrandIdentityModel>(
      `${this.apiUrl}/getAll/${projectId}`
    );
  }

  updateBrandIdentity(
    projectId: string,
    brandingId: string,
    brandData: Partial<BrandIdentityModel>
  ): Observable<BrandIdentityModel> {
    return this.http
      .put<BrandIdentityModel>(
        `${this.apiUrl}/${projectId}/update/${brandingId}`,
        brandData
      )
      .pipe(
        tap((response) =>
          console.log('updateBrandIdentityModel response:', response)
        ),
        catchError((error) => {
          console.error(
            `Error in updateBrandIdentityModel for ID ${brandingId}:`,
            error
          );
          throw error;
        })
      );
  }

  deleteBrandIdentityModel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log('deleteBrandIdentityModel response for ID ${id}:', response)
      ),
      catchError((error) => {
        console.error(`Error in deleteBrandIdentityModel for ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Download branding PDF from backend
   * @param projectId Project ID
   * @returns Observable with blob data for PDF download
   */
  downloadBrandingPdf(projectId: string): Observable<Blob> {
    const pdfUrl = `${this.apiUrl}/pdf/${projectId}`;

    return this.http
      .get(pdfUrl, {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      })
      .pipe(
        tap(() =>
          console.log(`Downloading branding PDF for project: ${projectId}`)
        ),
        catchError((error) => {
          console.error(
            `Error downloading branding PDF for project ${projectId}:`,
            error
          );

          // Handle specific error cases
          if (error.status === 401) {
            return throwError(() => new Error('User not authenticated'));
          } else if (error.status === 400) {
            return throwError(() => new Error('Project ID is required'));
          } else if (error.status === 404) {
            return throwError(() => {
              const notFoundError = new Error('PDF_NOT_FOUND');
              (notFoundError as any).isRetryable = false;
              return notFoundError;
            });
          } else if (error.status === 500) {
            return throwError(
              () =>
                new Error(
                  'Error generating branding PDF - project not found or no branding sections available'
                )
            );
          }

          // Generic error - also retryable
          return throwError(() => {
            const genericError = new Error('DOWNLOAD_ERROR');
            (genericError as any).isRetryable = true;
            return genericError;
          });
        })
      );
  }
}
