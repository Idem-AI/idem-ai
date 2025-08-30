import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public layout routes
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./modules/landing/pages/home/home').then((m) => m.Home),
    data: { layout: 'public' },
  },
  {
    path: 'premium-beta',
    loadComponent: () =>
      import(
        './modules/landing/pages/premium-beta-access/premium-beta-access'
      ).then((m) => m.PremiumBetaAccess),
    data: { layout: 'empty' },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/pages/login/login').then((m) => m.Login),
    data: { layout: 'empty' },
  },

  // Dashboard layout routes
  {
    path: 'console/dashboard',
    loadComponent: () =>
      import('./modules/dashboard/pages/dashboard/dashboard').then(
        (m) => m.DashboardComponent
      ),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/branding',
    loadComponent: () =>
      import('./modules/dashboard/pages/show-branding/show-branding').then(
        (m) => m.ShowBrandingComponent
      ),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/branding/generate',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/show-branding/branding-generation/branding-generation-page'
      ).then((m) => m.BrandingGenerationPage),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/business-plan',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/show-business-plan/show-business-plan'
      ).then((m) => m.ShowBusinessPlan),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/business-plan/generate',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/show-business-plan/business-plan-generation/business-plan-generation-page'
      ).then((m) => m.BusinessPlanGenerationPage),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/diagrams',
    loadComponent: () =>
      import('./modules/dashboard/pages/show-diagrams/show-diagrams').then(
        (m) => m.ShowDiagramsComponent
      ),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/diagrams/generate',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/show-diagrams/diagram-generation/diagram-generation-page'
      ).then((m) => m.DiagramGenerationPage),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/tests',
    loadComponent: () =>
      import('./modules/dashboard/pages/show-tests/show-tests').then(
        (m) => m.ShowTestsComponent
      ),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/development/create',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/development/create-development/create-development'
      ).then((m) => m.CreateDevelopmentComponent),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/development',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/development/show-development/show-development'
      ).then((m) => m.ShowDevelopment),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/deployments/create',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/deployment/create-deployment/create-deployment'
      ).then((m) => m.CreateDeployment),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/deployments',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/deployment/deployment-list/deployment-list'
      ).then((m) => m.DeploymentList),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/deployments/:id',
    loadComponent: () =>
      import(
        './modules/dashboard/pages/deployment/deployment-details/deployment-details'
      ).then((m) => m.DeploymentDetails),

    data: { layout: 'dashboard' },
  },
  {
    path: 'console',
    loadComponent: () =>
      import('./modules/dashboard/pages/projects-list/projects-list').then(
        (m) => m.ProjectsList
      ),
    data: { layout: 'empty' },
  },
  {
    path: 'console/projects',
    loadComponent: () =>
      import('./modules/dashboard/pages/projects-list/projects-list').then(
        (m) => m.ProjectsList
      ),
    data: { layout: 'dashboard' },
  },
  {
    path: 'console/profile',
    loadComponent: () =>
      import('./modules/dashboard/pages/profile/profile').then(
        (m) => m.ProfileComponent
      ),
    data: { layout: 'dashboard' },
  },

  // Project creation route
  {
    path: 'console/create-project',
    loadComponent: () =>
      import('./modules/dashboard/pages/create-project/create-project').then(
        (m) => m.CreateProjectComponent
      ),
    data: { layout: 'empty' },
  },

  // Policy pages
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./shared/components/privacy-policy/privacy-policy').then(
        (m) => m.PrivacyPolicy
      ),
    data: { layout: 'public' },
  },
  {
    path: 'terms-of-service',
    loadComponent: () =>
      import('./shared/components/terms-of-service/terms-of-service').then(
        (m) => m.TermsOfService
      ),
    data: { layout: 'public' },
  },
  {
    path: 'beta-policy',
    loadComponent: () =>
      import('./shared/components/beta-policy/beta-policy').then(
        (m) => m.BetaPolicy
      ),
    data: { layout: 'public' },
  },

  // 404 Not Found route
  {
    path: 'not-found',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
    data: { layout: 'public' },
  },

  // Catch all unknown routes and redirect to 404
  { path: '**', redirectTo: 'not-found' },
];
