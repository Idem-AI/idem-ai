import { Component, OnInit, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { DeploymentModel } from '../../../models/deployment.model';
import { DeploymentService } from '../../../services/deployment.service';
import { CookieService } from '../../../../../shared/services/cookie.service';
import { TerraformFiles } from '../create-deployment/components/terraform-files/terraform-files';
import { Loader } from '../../../../../components/loader/loader';
// PrimeNG Components
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-deployment-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TerraformFiles, Loader, AccordionModule],
  templateUrl: './deployment-details.html',
})
export class DeploymentDetails implements OnInit {
  // Angular-specific properties
  protected readonly deploymentId = input<string>('');

  // Component state
  protected readonly deployment = signal<DeploymentModel | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly projectId = signal<string | null>(null);

  // Computed properties
  protected readonly hasDeployment = computed(() => !!this.deployment());
  protected readonly isCompleted = computed(
    () =>
      this.deployment()?.status === 'deployed' ||
      this.deployment()?.status === 'failed' ||
      this.deployment()?.status === 'cancelled'
  );
  protected readonly showTerraformFiles = computed(
    () =>
      this.hasDeployment() &&
      this.deployment()?.generatedTerraformTfvarsFileContent !== undefined
  );

  // Services
  private readonly deploymentService = inject(DeploymentService);
  private readonly cookieService = inject(CookieService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.fetchDeploymentData();
  }

  protected fetchDeploymentData(): void {
    // Use route params if input is not provided through router binding
    const deploymentId =
      this.deploymentId() || this.route.snapshot.paramMap.get('id');
    const projectId = this.cookieService.get('projectId');

    if (!deploymentId || !projectId) {
      this.error.set('Missing deployment ID or project ID');
      this.loading.set(false);
      return;
    }

    this.projectId.set(projectId);
    this.loading.set(true);
    this.error.set(null);

    this.deploymentService
      .getDeploymentById(projectId, deploymentId)
      .subscribe({
        next: (deployment) => {
          console.log('Fetched deployment details:', deployment);
          this.deployment.set(deployment);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error fetching deployment details:', error);
          this.error.set('Failed to load deployment details');
          this.loading.set(false);
        },
      });
  }

  protected redeployDeployment(): void {
    const deploymentId =
      this.deploymentId() || this.route.snapshot.paramMap.get('id');
    const projectId = this.projectId();

    if (!deploymentId || !projectId) {
      this.error.set('Cannot redeploy: Missing deployment ID or project ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.deploymentService
      .redeployDeployment(projectId, deploymentId)
      .subscribe({
        next: (updatedDeployment) => {
          console.log('Redeployed successfully:', updatedDeployment);
          this.deployment.set(updatedDeployment);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error redeploying:', error);
          this.error.set('Failed to redeploy');
          this.loading.set(false);
        },
      });
  }

  protected cancelDeployment(): void {
    const deploymentId =
      this.deploymentId() || this.route.snapshot.paramMap.get('id');
    const projectId = this.projectId();

    if (!deploymentId || !projectId) {
      this.error.set('Cannot cancel: Missing deployment ID or project ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.deploymentService.cancelDeployment(projectId, deploymentId).subscribe({
      next: (updatedDeployment) => {
        console.log('Cancelled successfully:', updatedDeployment);
        this.deployment.set(updatedDeployment);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error cancelling deployment:', error);
        this.error.set('Failed to cancel deployment');
        this.loading.set(false);
      },
    });
  }

  protected formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  /**
   * Generates a deployment pipeline for the current deployment
   */
  protected generatePipeline(): void {
    const deploymentId =
      this.deploymentId() || this.route.snapshot.paramMap.get('id');
    const projectId = this.projectId();

    if (!deploymentId || !projectId) {
      this.error.set(
        'Cannot generate pipeline: Missing deployment ID or project ID'
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.deploymentService.generatePipeline(projectId, deploymentId).subscribe({
      next: (updatedDeployment: DeploymentModel) => {
        console.log('Pipeline generated successfully:', updatedDeployment);
        this.deployment.set(updatedDeployment);
        this.loading.set(false);
      },
      error: (error: Error) => {
        console.error('Error generating pipeline:', error);
        this.error.set('Failed to generate deployment pipeline');
        this.loading.set(false);
      },
    });
  }

  /**
   * Generates Terraform files for the current deployment
   */
  protected generateTerraformFiles(): void {
    const deploymentId =
      this.deploymentId() || this.route.snapshot.paramMap.get('id');
    const projectId = this.projectId();

    if (!deploymentId || !projectId) {
      this.error.set(
        'Cannot generate Terraform files: Missing deployment ID or project ID'
      );
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.deploymentService
      .generateTerraformFiles(projectId, deploymentId)
      .subscribe({
        next: (updatedDeployment: DeploymentModel) => {
          console.log(
            'Terraform files generated successfully:',
            updatedDeployment
          );
          this.deployment.set(updatedDeployment);
          this.loading.set(false);
        },
        error: (error: Error) => {
          console.error('Error generating Terraform files:', error);
          this.error.set('Failed to generate Terraform files');
          this.loading.set(false);
        },
      });
  }
}
