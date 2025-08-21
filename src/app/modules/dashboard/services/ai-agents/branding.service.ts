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
import { BrandingStepEvent } from '../../models/branding-step.model';
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
   * Map generic SSE event to BrandingStepEvent
   * @param sseEvent Generic SSE event
   * @returns BrandingStepEvent
   */
  private mapToBrandingStepEvent(sseEvent: SSEStepEvent): BrandingStepEvent {
    return {
      type: sseEvent.type as 'started' | 'completed',
      stepName: sseEvent.stepName || '',
      data: sseEvent.data || '',
      summary: sseEvent.summary || '',
      timestamp: sseEvent.timestamp || new Date().toISOString(),
      parsedData: {
        status: sseEvent.parsedData?.status || sseEvent.type,
        stepName: sseEvent.parsedData?.stepName || sseEvent.stepName || '',
      },
    };
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
  }> {
    console.log('Generating colors and typography...');
    console.log('Project:', project);
    return this.http
      .post<{
        colors: ColorModel[];
        typography: TypographyModel[];
      }>(`${this.apiUrl}/genColorsAndTypography`, { project })
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

  generateLogo(
    project: ProjectModel,
    selectedColor: ColorModel,
    selectedTypography: TypographyModel
  ): Observable<{
    logos: LogoModel[];
  }> {
    console.log('Generating logo with selected color and typography...');
    console.log('Project:', project);
    console.log('Selected Color:', selectedColor);
    console.log('Selected Typography:', selectedTypography);
    return this.http
      .post<{
        logos: LogoModel[];
      }>(`${this.apiUrl}/genLogos`, {
        project,
        color: selectedColor,
        typography: selectedTypography,
      })
      .pipe(
        tap((response) => console.log('generateLogo response:', response)),
        catchError((error) => {
          console.error('Error in generateLogo:', error);
          throw error;
        })
      );
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
          } else if (error.status === 500) {
            return throwError(
              () =>
                new Error(
                  'Error generating branding PDF - project not found or no branding sections available'
                )
            );
          }

          return throwError(() => new Error('Failed to download branding PDF'));
        })
      );
  }
}
