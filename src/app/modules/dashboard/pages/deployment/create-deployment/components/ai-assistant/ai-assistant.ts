import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  AiAssistantDeploymentModel,
  ChatMessage,
  ArchitectureComponent,
  FormOption,
  SensitiveVariable,
  SensitiveVariableValue,
  StoreSensitiveVariablesRequest,
} from '../../../../../models/deployment.model';
import {
  DeploymentFormData,
  DeploymentValidators,
} from '../../../../../models/api/deployments/deployments.api.model';
import { CookieService } from '../../../../../../../shared/services/cookie.service';
import { DeploymentService } from '../../../../../services/deployment.service';
import { MarkdownModule, MarkdownService } from 'ngx-markdown';

// Import Prism core only - specific languages are already imported in app.config.ts
import 'prismjs';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MarkdownModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant implements OnInit, AfterViewInit {
  // Angular properties (inputs, outputs, queries)

  // AI Assistant state signals
  protected readonly chatMessages = signal<ChatMessage[]>([]);
  protected readonly aiPrompt = signal<string>('');
  protected readonly aiIsThinking = signal<boolean>(false);
  protected readonly showDeploymentForm = signal<boolean>(true);
  protected readonly loadingDeployment = signal<boolean>(false);
  protected readonly projectId = signal<string | null>(null);
  protected readonly errorMessages = signal<string[]>([]);
  protected readonly validationErrors = signal<string[]>([]);
  protected readonly generatedArchitecture = signal<boolean>(false);
  protected readonly generatedComponents = signal<ArchitectureComponent[] | null>(null);

  // Architecture proposal signals
  protected readonly activeProposedComponent =
    signal<ArchitectureComponent | null>(null);
  protected readonly configurationDialogVisible = signal<boolean>(false);
  protected readonly currentProposalMessage = signal<ChatMessage | null>(null);
  protected readonly configuredComponents = signal<Set<string>>(
    new Set<string>()
  );

  // Architecture component forms
  private readonly componentForms = new Map<string, FormGroup>();
  
  // Sensitive variables handling
  protected readonly showSensitiveVariablesDialog = signal<boolean>(false);
  protected readonly currentSensitiveVariables = signal<SensitiveVariable[]>([]);
  protected readonly sensitiveVariablesForm = signal<FormGroup | null>(null);
  protected readonly storingSensitiveVariables = signal<boolean>(false);
  protected readonly currentDeploymentId = signal<string | null>(null);

  // Computed values
  protected readonly hasUnacceptedArchitecture = computed(() => {
    return this.chatMessages().some(msg => 
      msg.isProposingArchitecture && 
      msg.proposedComponents && 
      msg.proposedComponents.length > 0
    ) && !this.generatedArchitecture();
  });

  // Form controls
  protected deploymentConfigForm: FormGroup;

  // Services
  private readonly formBuilder = inject(FormBuilder);
  private readonly cookieService = inject(CookieService);
  private readonly deploymentService = inject(DeploymentService);
  private readonly markdownService = inject(MarkdownService);
  private readonly router = inject(Router);

  constructor() {
    this.deploymentConfigForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      environment: ['development', Validators.required],
      repoUrl: [''],
      branch: ['main'],
    });
  }

  ngOnInit(): void {
    // Reset the architecture state at initialization
    this.generatedArchitecture.set(false);
    this.generatedComponents.set(null);
    
    // Initialize project ID from cookie
    const projectId = this.cookieService.get('projectId');
    if (!projectId) {
      console.error('No project ID found in cookies');
      this.errorMessages.set([
        'No project selected. Please select a project first.',
      ]);
    } else {
      this.projectId.set(projectId);
      console.log('AI Assistant initialized with project ID:', projectId);
    }

    // Initialize chat with welcome message
    this.chatMessages.set([
      {
        sender: 'ai',
        text: "Hello! I'm your AI assistant. Describe the infrastructure you'd like to deploy.",
        timestamp: new Date(),
      },
    ]);

    // Set up form validation
    this.setupFormValidation();
  }

  private clearErrors(): void {
    this.errorMessages.set([]);
    this.validationErrors.set([]);
  }

  // --- SETUP METHODS ---
  private setupFormValidation(): void {
    this.deploymentConfigForm.valueChanges.subscribe(() => {
      this.validateCurrentForm();
    });
  }

  protected updatePrompt(prompt: string): void {
    this.aiPrompt.set(prompt);
  }

  /**
   * Toggles the visibility of the deployment form section
   */
  protected toggleDeploymentForm(): void {
    this.showDeploymentForm.update((value) => !value);
  }

  // --- ARCHITECTURE PROPOSAL METHODS ---

  /**
   * Selects a component from the proposed architecture for configuration
   */
  protected selectProposedComponent(
    component: ArchitectureComponent,
    message: ChatMessage
  ): void {
    this.activeProposedComponent.set(component);
    this.currentProposalMessage.set(message);
    this.configurationDialogVisible.set(true);

    // Create a form for this component if it doesn't exist already
    if (!this.componentForms.has(component.instanceId)) {
      this.createComponentForm(component);
    }
  }

  /**
   * Creates a form group for component configuration
   */
  private createComponentForm(component: ArchitectureComponent): void {
    if (!component.options || component.options.length === 0) {
      // If no options, create an empty form group
      this.componentForms.set(component.instanceId, this.formBuilder.group({}));
      return;
    }

    const formGroup = this.formBuilder.group({});

    // Add form controls for each option
    component.options.forEach((option) => {
      const validators = option.required ? [Validators.required] : [];
      formGroup.addControl(
        option.name,
        this.formBuilder.control(option.defaultValue || '', validators)
      );
    });

    this.componentForms.set(component.instanceId, formGroup);
  }

  /**
   * Saves the component configuration
   */
  protected saveComponentConfiguration(): void {
    const component = this.activeProposedComponent();
    const message = this.currentProposalMessage();

    if (!component || !message) return;

    // Get form values
    const form = this.componentForms.get(component.instanceId);
    if (!form) return;

    // Update component configuration
    const components = message.proposedComponents?.map((c) => {
      if (c.instanceId === component.instanceId) {
        return {
          ...c,
          configuration: form.value,
        };
      }
      return c;
    });

    // Update message with configured component
    if (message.proposedComponents && components) {
      message.proposedComponents = components;

      // Mark as configured
      this.configuredComponents.update((set) => {
        const newSet = new Set(set);
        newSet.add(component.instanceId);
        return newSet;
      });
    }

    this.configurationDialogVisible.set(false);
  }

  /**
   * Checks if a component has been configured
   */
  protected isComponentConfigured(instanceId: string): boolean {
    return this.configuredComponents().has(instanceId);
  }

  /**
   * Gets the form group for the active component
   */
  protected getActiveComponentForm(): FormGroup | null {
    const component = this.activeProposedComponent();
    if (!component) return null;

    return this.componentForms.get(component.instanceId) || null;
  }

  /**
   * Gets the options for the active component
   */
  protected getActiveComponentOptions(): FormOption[] {
    const component = this.activeProposedComponent();
    if (!component) return [];

    return component.options || [];
  }

  /**
   * Accepts the proposed architecture and adds it to the deployment
   */
  protected acceptProposedArchitecture(message: ChatMessage): void {
    if (!message.proposedComponents) return;

    // Check if all components are configured
    const allConfigured = message.proposedComponents.every((component) =>
      this.isComponentConfigured(component.instanceId)
    );

    if (!allConfigured) {
      const unconfiguredCount = message.proposedComponents.filter(
        (c) => !this.isComponentConfigured(c.instanceId)
      ).length;

      this.errorMessages.set([
        `Please configure all ${unconfiguredCount} component(s) before accepting the architecture`,
      ]);
      return;
    }

    // Set generated architecture flag
    this.generatedArchitecture.set(true);
    
    // Store the configured components
    this.generatedComponents.set([...message.proposedComponents]);
    
    // Log the accepted architecture
    console.log('Architecture accepted:', this.generatedComponents());

    // Add a confirmation message from AI
    this.chatMessages.update((messages) => [
      ...messages,
      {
        sender: 'ai',
        text: 'Great! The architecture has been accepted. You can now create the deployment with these components.',
        timestamp: new Date(),
      },
    ]);

    // Clear error messages
    this.errorMessages.set([]);
  }

  ngAfterViewInit(): void {
    // Initialize Prism for syntax highlighting after view is initialized
    if (typeof window !== 'undefined') {
      const Prism = (window as any).Prism;
      if (Prism) {
        console.log('Prism initialized for syntax highlighting');
      }
    }
  }

  protected sendAiPrompt(): void {
    const prompt = this.aiPrompt().trim();
    if (!prompt || this.aiIsThinking()) return;

    // Clear the input field
    this.aiPrompt.set('');

    // Create user message
    const userMessage: ChatMessage = {
      sender: 'user',
      text: prompt,
      timestamp: new Date(),
    };

    // Add user message to chat
    this.chatMessages.update((messages) => [...messages, userMessage]);

    // Set thinking state
    this.aiIsThinking.set(true);

    // Send message to backend using DeploymentService
    this.deploymentService
      .sendChatMessage(userMessage, this.projectId()!)
      .subscribe({
        next: (response) => {
          // Add AI response to chat
          this.chatMessages.update((messages) => [...messages, response]);

          // Handle sensitive variables request
          if (response.isRequestingSensitiveVariables && response.requestedSensitiveVariables) {
            this.handleSensitiveVariablesRequest(response.requestedSensitiveVariables);
          }

          // Set architecture as generated if this is the first user message
          if (!this.generatedArchitecture()) {
            this.generatedArchitecture.set(true);
          }

          // Stop thinking state
          this.aiIsThinking.set(false);

          // Validate form after AI response
          this.validateCurrentForm();
        },
        error: (error) => {
          console.error('Error getting AI response:', error);

          // Add error message to chat
          this.chatMessages.update((messages) => [
            ...messages,
            {
              sender: 'ai',
              text: 'Sorry, I encountered an error processing your request. Please try again.',
              timestamp: new Date(),
            },
          ]);

          // Stop thinking state
          this.aiIsThinking.set(false);

          // Add to error messages
          this.errorMessages.update((msgs) => [
            ...msgs,
            error.message || 'Failed to get AI response',
          ]);
        },
      });
  }

  // No longer needed as we're using the real API

  private getFormData(): DeploymentFormData {
    const formValue = this.deploymentConfigForm.value;

    // Use the stored generatedComponents instead of searching through chat messages
    const components = this.generatedComponents() || [];

    return {
      mode: 'ai-assistant',
      name: formValue.name,
      environment: formValue.environment,
      repoUrl: formValue.repoUrl,
      branch: formValue.branch,
      aiPrompt: this.chatMessages()
        .map((msg) => msg.text)
        .join('\n'),
      chatMessages: this.chatMessages(),
      aiGeneratedArchitecture: this.generatedArchitecture(),
      customComponents: components,
    };
  }

  private validateCurrentForm(): void {
    const formData = this.getFormData();
    const errors: string[] = [];

    // Complete form validation
    errors.push(...DeploymentValidators.validateFormData(formData));

    // Git repository validation (if provided)
    if (formData.repoUrl) {
      const gitRepo = {
        url: formData.repoUrl,
        branch: formData.branch || 'main',
        provider: 'github' as 'github' | 'gitlab' | 'bitbucket' | 'azure-repos',
      };
      errors.push(...DeploymentValidators.validateGitRepository(gitRepo));
    }

    // AI-specific validation
    if (this.chatMessages().length <= 1) {
      // Only the welcome message
      errors.push(
        'Please interact with the AI assistant before creating a deployment'
      );
    }

    this.validationErrors.set(errors);
  }

  // --- SENSITIVE VARIABLES HANDLING ---
  
  /**
   * Handles sensitive variables request from AI
   */
  private handleSensitiveVariablesRequest(sensitiveVariables: SensitiveVariable[]): void {
    console.log('AI requested sensitive variables:', sensitiveVariables);
    
    this.currentSensitiveVariables.set(sensitiveVariables);
    this.createSensitiveVariablesForm(sensitiveVariables);
    this.showSensitiveVariablesDialog.set(true);
  }
  
  /**
   * Creates a form for sensitive variables input
   */
  private createSensitiveVariablesForm(sensitiveVariables: SensitiveVariable[]): void {
    const formGroup = this.formBuilder.group({});
    
    sensitiveVariables.forEach((variable) => {
      const validators = variable.required ? [Validators.required] : [];
      
      // Add specific validators based on type
      if (variable.type === 'string' && variable.name.includes('password')) {
        validators.push(Validators.minLength(8));
      }
      
      formGroup.addControl(
        variable.name,
        this.formBuilder.control('', validators)
      );
    });
    
    this.sensitiveVariablesForm.set(formGroup);
  }
  
  /**
   * Submits sensitive variables to backend
   */
  protected submitSensitiveVariables(): void {
    const form = this.sensitiveVariablesForm();
    const deploymentId = this.currentDeploymentId();
    
    if (!form || !form.valid || !deploymentId) {
      this.errorMessages.set(['Please fill in all required sensitive variables.']);
      return;
    }
    
    this.storingSensitiveVariables.set(true);
    this.clearErrors();
    
    // Convert form values to SensitiveVariableValue format
    const sensitiveVariables: SensitiveVariableValue[] = this.currentSensitiveVariables().map(variable => ({
      key: variable.name,
      value: form.value[variable.name] || '',
      isSecret: variable.sensitive
    }));
    
    const request: StoreSensitiveVariablesRequest = {
      sensitiveVariables
    };
    
    console.log('Storing sensitive variables:', request);
    
    this.deploymentService
      .storeSensitiveVariables(this.projectId()!, deploymentId, request)
      .subscribe({
        next: (response) => {
          console.log('Sensitive variables stored successfully:', response);
          
          // Add success message to chat
          this.chatMessages.update((messages) => [
            ...messages,
            {
              sender: 'ai',
              text: `✅ Successfully stored ${response.storedCount} sensitive variables securely. Your deployment configuration is now complete.`,
              timestamp: new Date(),
            },
          ]);
          
          this.storingSensitiveVariables.set(false);
          this.showSensitiveVariablesDialog.set(false);
          
          // Navigate to deployments page
          this.router.navigate(['/console/deployments']);
        },
        error: (error) => {
          console.error('Error storing sensitive variables:', error);
          this.storingSensitiveVariables.set(false);
          this.errorMessages.set([
            error.message || 'Failed to store sensitive variables securely',
          ]);
        },
      });
  }
  
  /**
   * Cancels sensitive variables input
   */
  protected cancelSensitiveVariables(): void {
    this.showSensitiveVariablesDialog.set(false);
    this.currentSensitiveVariables.set([]);
    this.sensitiveVariablesForm.set(null);
  }

  protected createDeployment(): void {
    // Validate project ID
    if (!this.projectId()) {
      this.errorMessages.set([
        'No project selected. Please select a project first.',
      ]);
      return;
    }

    // Validate form
    if (!this.deploymentConfigForm.valid) {
      this.errorMessages.set(['Please fill in all required fields.']);
      return;
    }

    // Validate AI interaction
    if (this.chatMessages().length <= 1) {
      // Only the welcome message
      this.errorMessages.set([
        'Please interact with the AI assistant before creating a deployment',
      ]);
      return;
    }

    this.loadingDeployment.set(true);
    this.clearErrors();

    // Get form data
    const formData = this.getFormData();

    // Use stored generatedComponents
    const proposedComponents = this.generatedComponents() || [];

    // Use DeploymentMapper to create the deployment object
    const deploymentData: AiAssistantDeploymentModel = {
      mode: 'ai-assistant',
      chatMessages: this.chatMessages(),
      aiGeneratedArchitecture: this.generatedArchitecture(),
      name: formData.name,
      environment: formData.environment,
      id: '',
      projectId: this.projectId()!,
      status: 'configuring',
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedComponents: proposedComponents,
    };

    // Log the payload for debugging
    console.log(
      'Creating AI assistant deployment with payload:',
      deploymentData
    );

    // Submit to service
    this.deploymentService
      .createAiAssistantDeployment(deploymentData)
      .subscribe({
        next: (deployment) => {
          console.log(
            'AI assistant deployment created successfully:',
            deployment
          );
          
          // Store deployment ID for sensitive variables
          this.currentDeploymentId.set(deployment.id);
          
          this.loadingDeployment.set(false);
          
          // Check if we need to collect sensitive variables
          const hasSensitiveVariablesRequest = this.chatMessages().some(
            msg => msg.isRequestingSensitiveVariables && msg.requestedSensitiveVariables
          );
          
          if (hasSensitiveVariablesRequest) {
            // Find the latest sensitive variables request
            const sensitiveVarsMessage = this.chatMessages()
              .reverse()
              .find(msg => msg.isRequestingSensitiveVariables && msg.requestedSensitiveVariables);
              
            if (sensitiveVarsMessage?.requestedSensitiveVariables) {
              this.handleSensitiveVariablesRequest(sensitiveVarsMessage.requestedSensitiveVariables);
            }
          } else {
            // No sensitive variables needed, navigate directly
            this.router.navigate(['/console/deployments']);
          }
        },
        error: (error) => {
          console.error('Error creating AI assistant deployment:', error);
          this.loadingDeployment.set(false);
          this.errorMessages.set([
            error.message || 'Failed to create AI assistant deployment',
          ]);
        },
      });
  }
}
