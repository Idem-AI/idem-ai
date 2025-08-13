/**
 * Generation types for development
 */
export type GenerationType = 'landing' | 'app' | 'both';

/**
 * Development modes
 */
export type DevelopmentMode = 'quick' | 'advanced';

/**
 * Quick generation preset configurations
 */
export interface QuickGenerationPreset {
  name: string;
  description: string;
  frontend: {
    framework: string;
    styling: string[];
    features: string[];
  };
  backend: {
    language: string;
    framework: string;
    apiType: string;
    features: string[];
  };
  database: {
    type: string;
    provider: string;
    features: string[];
  };
}

/**
 * Model for development configurations that will be sent to the backend
 */
export interface DevelopmentConfigsModel {
  mode: DevelopmentMode;
  generationType: GenerationType;
  constraints: string[];
  preset?: string; // For quick generation mode
  frontend: {
    framework: string;
    frameworkVersion?: string;
    frameworkIconUrl?: string;
    styling: string[] | string;
    stateManagement?: string;
    features:
      | {
          routing?: boolean;
          componentLibrary?: boolean;
          testing?: boolean;
          pwa?: boolean;
          seo?: boolean;
          [key: string]: boolean | undefined;
        }
      | string[];
  };

  backend: {
    language?: string;
    languageVersion?: string;
    languageIconUrl?: string;
    framework: string;
    frameworkVersion?: string;
    frameworkIconUrl?: string;
    apiType: string;
    apiVersion?: string;
    apiIconUrl?: string;
    orm?: string;
    ormVersion?: string;
    ormIconUrl?: string;
    features:
      | {
          authentication?: boolean;
          authorization?: boolean;
          documentation?: boolean;
          testing?: boolean;
          logging?: boolean;
          [key: string]: boolean | undefined;
        }
      | string[];
  };

  database: {
    type?: string;
    typeVersion?: string;
    typeIconUrl?: string;
    provider: string;
    providerVersion?: string;
    providerIconUrl?: string;
    orm?: string;
    ormVersion?: string;
    ormIconUrl?: string;
    features:
      | {
          migrations?: boolean;
          seeders?: boolean;
          caching?: boolean;
          replication?: boolean;
          realTimeSubscriptions?: boolean;
          authentication?: boolean;
          storage?: boolean;
          edgeFunctions?: boolean;
          vectorSearch?: boolean;
          [key: string]: boolean | undefined;
        }
      | string[];
  };

  deployment?: {
    platform?: string;
    platformVersion?: string;
    platformIconUrl?: string;
    environment?: string;
    features?: {
      cicd?: boolean;
      monitoring?: boolean;
      analytics?: boolean;
      scaling?: boolean;
      ssl?: boolean;
      [key: string]: boolean | undefined;
    } | string[];
  };

  projectConfig: {
    seoEnabled: boolean;
    contactFormEnabled: boolean;
    analyticsEnabled: boolean;
    i18nEnabled: boolean;
    performanceOptimized: boolean;
    authentication: boolean;
    authorization: boolean;
    paymentIntegration?: boolean;
    customOptions?: Record<string, any>;
  };
}
