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
import { BusinessPlanService } from '../../services/ai-agents/business-plan.service';
import { BusinessPlanModel } from '../../models/businessPlan.model';
import { BusinessPlanDisplayComponent } from './components/business-plan-display/business-plan-display';
import { Loader } from '../../../../components/loader/loader';

@Component({
  selector: 'app-show-business-plan',
  standalone: true,
  imports: [CommonModule, BusinessPlanDisplayComponent, Loader],
  templateUrl: './show-business-plan.html',
  styleUrls: ['./show-business-plan.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowBusinessPlan implements OnInit {
  // Injected services
  private readonly businessPlanService = inject(BusinessPlanService);
  private readonly cookieService = inject(CookieService);
  private readonly router = inject(Router);

  // Signals for state management
  protected readonly isLoading = signal<boolean>(true);
  protected readonly existingBusinessPlan = signal<BusinessPlanModel | null>(
    null
  );
  protected readonly projectIdFromCookie = signal<string | null>(null);

  ngOnInit(): void {
    // Get project ID from cookies
    const projectId = this.cookieService.get('projectId');
    this.projectIdFromCookie.set(projectId);

    if (projectId) {
      this.loadExistingBusinessPlan(projectId);
    } else {
      this.isLoading.set(false);
    }
  }

  /**
   * Load existing business plan for the project
   */
  private loadExistingBusinessPlan(projectId: string): void {
    this.businessPlanService.getBusinessplanItems(projectId).subscribe({
      next: (businessPlan: BusinessPlanModel) => {
        if (
          businessPlan &&
          businessPlan.sections &&
          businessPlan.sections.length > 0
        ) {
          // Existing business plan found - show it
          this.existingBusinessPlan.set(businessPlan);
        } else {
          // No existing business plan - show generate button (no redirect)
          console.log(
            'No existing business plan found, showing generate button'
          );
          this.existingBusinessPlan.set(null);
        }

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading business plan:', err);
        // Error loading - show generate button (no redirect)
        console.log('Error loading business plan, showing generate button');
        this.existingBusinessPlan.set(null);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Navigate to business plan generation page
   */
  protected generateBusinessPlan(): void {
    console.log('Navigating to business plan generation page');
    this.router.navigate(['/console/business-plan/generate']);
  }

  /**
   * Navigate to projects page
   */
  protected goToProjects(): void {
    console.log('Navigating to projects page');
    this.router.navigate(['/console/projects']);
  }
}
