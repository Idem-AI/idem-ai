import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TechCardModel } from '../shared/tech-card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-deployment-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule],
  templateUrl: './deployment-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentConfigComponent {
  // Input properties - configuration from previous steps
  readonly frontendConfig = input<any>();
  readonly backendConfig = input<any>();
  readonly databaseConfig = input<any>();
  readonly deploymentForm = input<FormGroup>();
  readonly showAdvancedOptions = input<boolean>();
  readonly versionOptions = input<{
    [key: string]: { [key: string]: string[] };
  }>({});

  // Selected deployment platform
  protected readonly selectedPlatform = signal<string | null>(null);

  /**
   * Track whether form is valid for parent components
   */
  protected readonly formValid = computed(() => {
    return this.deploymentForm()?.valid ?? false;
  });

  /**
   * Filtered deployment options based on frontend/backend/database choices
   */
  protected readonly filteredDeploymentOptions = computed(() => {
    const frontend = this.frontendConfig();
    const backend = this.backendConfig();
    const database = this.databaseConfig();

    return this.deploymentOptions.filter(option => {
      // Docker - compatible with all stacks
      if (option.id === 'docker') return true;

      // Vercel - only for frontend frameworks (React, Next.js, Vue, Angular)
      if (option.id === 'vercel') {
        return frontend?.framework && ['react', 'nextjs', 'vue', 'angular'].includes(frontend.framework);
      }

      // Netlify - only for frontend frameworks
      if (option.id === 'netlify') {
        return frontend?.framework && ['react', 'vue', 'angular', 'svelte'].includes(frontend.framework);
      }

      // AWS - compatible with all, but requires backend
      if (option.id === 'aws') {
        return backend?.framework && backend.framework !== '';
      }

      // Azure - compatible with all, prefers .NET/C# backends
      if (option.id === 'azure') {
        return backend?.framework && backend.framework !== '';
      }

      // Kubernetes - only for complex setups (backend + database)
      if (option.id === 'kubernetes') {
        return backend?.framework && database?.provider;
      }

      return true;
    });
  });

  /**
   * Get recommended platform based on stack
   */
  protected readonly recommendedPlatform = computed(() => {
    const frontend = this.frontendConfig();
    const backend = this.backendConfig();
    const database = this.databaseConfig();

    // React/Next.js -> Vercel
    if (frontend?.framework === 'react' || frontend?.framework === 'nextjs') {
      return 'vercel';
    }

    // Node.js backend with Firebase -> Vercel or Netlify
    if (backend?.language === 'javascript' || backend?.language === 'typescript') {
      if (database?.provider === 'firebase' || database?.provider === 'supabase') {
        return 'vercel';
      }
    }

    // Complex backend (Java, Python, Go) -> AWS or Docker
    if (backend?.language && ['java', 'python', 'go', 'csharp'].includes(backend.language)) {
      return 'aws';
    }

    // Default to Docker for flexibility
    return 'docker';
  });

  /**
   * Get deployment description based on current stack
   */
  protected getDeploymentDescription(platformId: string): string {
    const frontend = this.frontendConfig();
    const backend = this.backendConfig();

    switch(platformId) {
      case 'vercel':
        return `Perfect for ${frontend?.framework || 'frontend'} with serverless backend`;
      case 'netlify':
        return `Optimized for ${frontend?.framework || 'frontend'} static sites`;
      case 'docker':
        return `Containerized deployment for ${backend?.framework || 'your'} stack`;
      case 'aws':
        return `Scalable cloud infrastructure for ${backend?.language || 'your'} backend`;
      case 'azure':
        return `Enterprise cloud for ${backend?.framework || 'your'} application`;
      case 'kubernetes':
        return `Orchestrated containers for complex ${backend?.framework || ''} architectures`;
      default:
        return 'Flexible deployment solution';
    }
  }

  /**
   * Check if platform is recommended
   */
  protected isPlatformRecommended(platformId: string): boolean {
    return this.recommendedPlatform() === platformId;
  }

  /**
   * Select a deployment platform
   */
  protected selectPlatform(platformId: string): void {
    this.selectedPlatform.set(platformId);
  }

  /**
   * Get versions for the selected deployment platform
   */
  protected getDeploymentVersions(platformId: string): string[] {
    // Find the selected platform in our deploymentOptions array
    const platform = this.deploymentOptions.find((p) => p.id === platformId);
    // Return its versions if available
    if (platform?.versions) {
      return platform.versions;
    }
    return ['Latest'];
  }

  /**
   * Get versions for the selected CI/CD provider
   */
  protected getCicdVersions(cicdId: string): string[] {
    // Find the selected CI/CD option in our cicdOptions array
    const cicd = this.cicdOptions.find((c) => c.id === cicdId);
    // Return its versions if available
    if (cicd?.versions) {
      return cicd.versions;
    }
    return ['Latest'];
  }

  /**
   * Features list for easier form handling
   */
  protected readonly featuresList = [
    {
      id: 'monitoring',
      name: 'Monitoring',
      description: 'Application performance tracking',
    },
    {
      id: 'continuousDeployment',
      name: 'Continuous Deployment',
      description: 'Automatic deployment pipeline',
    },
    {
      id: 'ssl',
      name: 'SSL Certificates',
      description: 'HTTPS encryption',
    },
    {
      id: 'backups',
      name: 'Automated Backups',
      description: 'Regular data backup',
    },
    {
      id: 'logging',
      name: 'Centralized Logging',
      description: 'Log collection and analysis',
    },
    {
      id: 'scaling',
      name: 'Auto-scaling',
      description: 'Dynamic resource allocation',
    },
  ];

  /**
   * Deployment options
   */
  protected readonly deploymentOptions: TechCardModel[] = [
    {
      id: 'docker',
      name: 'Docker',
      icon: 'https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png',
      color: '#2496ED',
      description: 'Container-based deployment',
      badges: ['Containerization', 'Portable', 'Scalable'],
      versions: ['24.0', '23.0', '20.10'],
      isAvailable: true,
    },
    {
      id: 'kubernetes',
      name: 'Kubernetes',
      icon: 'https://kubernetes.io/images/favicon.svg',
      color: '#326CE5',
      description: 'Container orchestration platform',
      badges: ['Orchestration', 'Scalability', 'Self-healing'],
      versions: ['1.29', '1.28', '1.27', '1.26'],
      isAvailable: false,
    },
    {
      id: 'aws',
      name: 'AWS',
      icon: 'https://a0.awsstatic.com/libra-css/images/site/touch-icon-ipad-144-smile.png',
      color: '#FF9900',
      description: 'Amazon Web Services cloud',
      badges: ['EC2', 'Lambda', 'S3'],
      versions: ['Latest'],
      isAvailable: false,
    },
    {
      id: 'azure',
      name: 'Azure',
      icon: 'https://azure.microsoft.com/content/dam/microsoft/final/en-us/microsoft-brand/icons/Azure.svg',
      color: '#0078D4',
      description: 'Microsoft cloud platform',
      badges: ['App Service', 'Functions', 'Storage'],
      versions: ['Latest'],
      isAvailable: false,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: 'https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png',
      color: '#000000',
      description: 'Frontend deployment platform',
      badges: ['Edge Network', 'Serverless', 'Preview'],
      versions: ['Latest'],
      isAvailable: true,
    },
    {
      id: 'netlify',
      name: 'Netlify',
      icon: 'https://www.netlify.com/v3/img/components/logomark-dark.svg',
      color: '#00C7B7',
      description: 'Frontend deployment platform',
      badges: ['Continuous Deployment', 'Forms', 'Functions'],
      versions: ['Latest'],
      isAvailable: true,
    },
  ];

  /**
   * CI/CD options
   */
  protected readonly cicdOptions: TechCardModel[] = [
    {
      id: 'github',
      name: 'GitHub Actions',
      icon: 'https://github.githubassets.com/assets/actions-icon-actions-61925a4b8822.svg',
      color: '#2088FF',
      description: 'GitHub integrated CI/CD',
      badges: ['GitHub', 'Built-in', 'YAML'],
      isAvailable: true,
    },
    {
      id: 'gitlab',
      name: 'GitLab CI',
      icon: 'https://about.gitlab.com/images/press/logo/png/gitlab-icon-rgb.png',
      color: '#FC6D26',
      description: 'GitLab integrated pipelines',
      badges: ['GitLab', 'Built-in', 'YAML'],
      isAvailable: false,
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      icon: 'https://www.jenkins.io/images/logos/jenkins/jenkins.svg',
      color: '#D33833',
      description: 'Self-hosted automation server',
      badges: ['Self-hosted', 'Groovy', 'Plugins'],
      isAvailable: false,
    },
    {
      id: 'circleci',
      name: 'CircleCI',
      icon: 'https://d3r49iyjzglexf.cloudfront.net/circleci-logo-stacked-fb-657e221fda1646a7e652c09c9fbfb2b0feb5d710089bb4d8e8c759d37a832694.png',
      color: '#343434',
      description: 'Cloud-based CI/CD service',
      badges: ['Cloud', 'Orbs', 'YAML'],
      isAvailable: false,
    },
  ];
}
