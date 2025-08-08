import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { BusinessPlanModel } from '../../models/businessPlan.model';
import { SSEService } from '../../../../shared/services/sse.service';
import { SSEStepEvent, SSEConnectionConfig } from '../../../../shared/models/sse-step.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessPlanService {
  private readonly apiUrl = `${environment.services.api.url}/project/businessPlans`;
  private readonly http = inject(HttpClient);
  private readonly sseService = inject(SSEService);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

 
  closeSSEConnection(): void {
    this.sseService.closeConnection('business-plan');
  }


  createBusinessplanItem(projectId: string): Observable<SSEStepEvent> {
    console.log('Starting business plan generation with SSE...');
    
    // Close any existing SSE connection
    this.closeSSEConnection();

    const config: SSEConnectionConfig = {
      url: `${this.apiUrl}/generate/${projectId}`,
      keepAlive: true,
      reconnectionDelay: 1000
    };

    return this.sseService.createConnection(config, 'business-plan');
  }



  cancelGeneration(): void {
    this.sseService.cancelGeneration('business-plan');
  }
  getBusinessplanItems(projectId?: string): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(`${this.apiUrl}/${projectId}`)
      .pipe(
      tap((response) =>
        console.log('getBusinessplanItems response:', response)
      ),
      catchError((error) => {
        console.error('Error in getBusinessplanItems:', error);
        throw error;
      })
    );
  }

  getBusinessplanItemById(id: string): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log('getBusinessplanItemById response:', response)
      ),
      catchError((error) => {
        console.error(`Error in getBusinessplanItemById for ID ${id}:`, error);
        throw error;
      })
    );
  }

  getBusinessplanItem(
    projectId: string,
    businessplanId: string
  ): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(
      `${this.apiUrl}/${projectId}/${businessplanId}`
    ).pipe(
      tap((response) =>
        console.log('getBusinessplanItem response:', response)
      ),
      catchError((error) => {
        console.error(`Error in getBusinessplanItem for ID ${businessplanId}:`, error);
        throw error;
      })
    );
  }

  updateBusinessplanItem(
    id: string,
    item: Partial<BusinessPlanModel>
  ): Observable<BusinessPlanModel> {
    return this.http.put<BusinessPlanModel>(`${this.apiUrl}/${id}`, item).pipe(
      tap((response) =>
        console.log('updateBusinessplanItem response:', response)
      ),
      catchError((error) => {
        console.error(`Error in updateBusinessplanItem for ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Delete a specific project businessplan item
  deleteBusinessplanItem(
    projectId: string,
    businessplanId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${projectId}/${businessplanId}`
    ).pipe(
      tap((response) =>
        console.log(`deleteBusinessplanItem response for ID ${businessplanId}:`, response)
      ),
      catchError((error) => {
        console.error(`Error in deleteBusinessplanItem for ID ${businessplanId}:`, error);
        throw error;
      })
    );
  }
}
