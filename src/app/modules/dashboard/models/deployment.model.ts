/**
 * Common interfaces used across all deployment types
 */
export interface GitRepository {
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure-repos';
  url: string;
  branch: string;
  accessToken?: string; // PAT or OAuth token (stored encrypted)
  webhookId?: string; // ID of the configured webhook
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  // Secrets are encrypted at rest and in transit
}

export interface PipelineStep {
  name: string;
  status: 'pending' | 'in-progress' | 'succeeded' | 'failed' | 'skipped';
  startedAt?: Date;
  finishedAt?: Date;
  logs?: string; // URL of the logs or snippet
  errorMessage?: string; // Error message if failed
  aiRecommendation?: string; // AI recommendations if failed
}

export interface CostEstimation {
  monthlyCost: number;
  hourlyCost: number;
  oneTimeCost: number;
  currency: string;
  estimatedAt: Date;
  breakdown: {
    componentId: string;
    componentName: string;
    cost: number;
    description: string;
  }[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

export interface ArchitectureTemplate {
  id: string;
  provider: 'aws' | 'gcp' | 'azure';
  category: string;
  name: string;
  description: string;
  tags: string[];
  icon: string;
}

// Form configuration interfaces
export interface FormOption {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'toggle';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  options?: { label: string; value: string }[];
}

export interface CloudComponentDetailed {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: 'aws' | 'gcp' | 'azure';
  icon: string;
  pricing?: string;
  options?: FormOption[];
}

export interface ArchitectureComponent extends CloudComponentDetailed {
  instanceId: string;
  type: string; // Component type identifier (e.g., 'database', 'compute', 'storage')
  configuration?: { [key: string]: any };
  dependencies?: string[];
}

/**
 * Deployment mode type for distinguishing between deployment types
 */
export type DeploymentMode =
  | 'beginner'
  | 'template'
  | 'ai-assistant'
  | 'expert';

/**
 * Base deployment model with common properties shared across all deployment types
 */
export interface BaseDeploymentModel {
  // Core identification
  id: string;
  projectId: string;
  name: string; // Friendly name for the deployment
  mode: DeploymentMode; // Type of deployment
  environment: 'development' | 'staging' | 'production';
  status:
    | 'configuring'
    | 'pending'
    | 'building'
    | 'infrastructure-provisioning'
    | 'deploying'
    | 'deployed'
    | 'rollback'
    | 'failed'
    | 'cancelled';

  // Configuration
  gitRepository?: GitRepository;
  environmentVariables?: EnvironmentVariable[];

  // Monitoring of the pipeline
  pipeline?: {
    currentStage: string;
    steps: PipelineStep[];
    startedAt?: Date;
    estimatedCompletionTime?: Date;
  };

  // Security and analysis
  staticCodeAnalysis?: {
    score?: number; // Code quality score (0-100)
    issues?: { severity: string; count: number }[];
    reportUrl?: string;
  };
  costEstimation?: CostEstimation;

  // Deployment details
  url?: string; // URL where the deployment can be accessed
  version?: string; // ex: commit hash or semantic version
  logs?: string; // Link to the deployment logs
  deployedAt?: Date; // Timestamp of the end of the deployment

  // Rollback management
  rollbackVersions?: string[]; // Previous versions for rollback
  lastSuccessfulDeployment?: string; // ID of the last successful deployment

  // Standard timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * beginner deployment model - simplest form with minimal configuration
 */
export interface QuickDeploymentModel extends BaseDeploymentModel {
  readonly mode: 'beginner';
  // beginner deployment specific fields
  frameworkType?: string;
  buildCommand?: string;
  startCommand?: string;
}

/**
 * Template deployment model - based on predefined architecture templates
 */
export interface TemplateDeploymentModel extends BaseDeploymentModel {
  readonly mode: 'template';
  // Template specific fields
  templateId: string;
  templateName: string;
  templateVersion?: string;
  customizations?: { [key: string]: any };
}

/**
 * AI Assistant deployment model - created through conversation with AI
 */
export interface AiAssistantDeploymentModel extends BaseDeploymentModel {
  readonly mode: 'ai-assistant';
  // AI Assistant specific fields
  chatMessages: ChatMessage[];
  aiGeneratedArchitecture?: boolean;
  aiRecommendations?: string[];
  generatedComponents?: ArchitectureComponent[];
}

/**
 * Expert deployment model - custom architecture with full configuration
 */
export interface ExpertDeploymentModel extends BaseDeploymentModel {
  readonly mode: 'expert';
  // Expert specific fields
  cloudComponents: CloudComponentDetailed[];
  architectureComponents: ArchitectureComponent[];
  customInfrastructureCode?: boolean;
  infrastructureAsCodeFiles?: { name: string; content: string }[];
}

/**
 * Union type representing all possible deployment models
 */
export type DeploymentModel =
  | QuickDeploymentModel
  | TemplateDeploymentModel
  | AiAssistantDeploymentModel
  | ExpertDeploymentModel;
