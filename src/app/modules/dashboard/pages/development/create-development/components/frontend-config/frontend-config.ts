import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TechCardComponent, TechCardModel } from '../shared/tech-card';

@Component({
  selector: 'app-frontend-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonModule, ToggleSwitchModule, TechCardComponent],
  templateUrl: './frontend-config.html',
  styleUrls: ['./frontend-config.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontendConfigComponent {
  // Input properties
  readonly frontendForm = input.required<FormGroup>();
  readonly versionOptions = input.required<{
    [key: string]: { [key: string]: string[] };
  }>();
  readonly showAdvancedOptions = input.required<boolean>();
  readonly selectedStylingPreferences = input.required<string[]>();

  // Output events
  @Output() readonly stylingPreferencesChange = new EventEmitter<string[]>();

  // State signals
  protected readonly advancedOptionsVisibleFor = signal<string | null>(null);

  // State signals

  /**
   * Available frontend frameworks
   */
  protected readonly frontendFrameworks = [
    {
      id: 'angular',
      name: 'Angular',
      icon: 'https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif',
      color: '#DD0031',
      description: 'Powerful framework with reactive programming',
      badges: ['TypeScript', 'RxJS', 'Standalone Components'],
      versions: ['latest', '19.x', '18.x', '17.x', '16.x', '15.x',],
    },
    {
      id: 'react',
      name: 'React',
      icon: 'https://icon.icepanel.io/Technology/svg/React.svg',
      color: '#61DAFB',
      description: 'Modern React with hooks and context API',
      badges: ['JSX', 'Virtual DOM', 'Component-Based'],
      versions: ['latest', '19.x', '18.x', '17.x'],
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
      color: '#000000',
      description: 'Full-stack React framework with SSR/SSG',
      badges: ['App Router', 'API Routes', 'ISR'],
      versions: ['latest', '14.x', '13.x', '12.x'],
    },
    {
      id: 'vue',
      name: 'Vue.js',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
      color: '#42b883',
      description: 'Progressive framework with intuitive API',
      badges: ['Composition API', 'SFCs', 'Pinia'],
      versions: ['latest', '3.x', '2.x'],
    },
    {
      id: 'svelte',
      name: 'Svelte',
      icon: 'https://icon.icepanel.io/Technology/svg/Svelte.svg',
      color: '#FF3E00',
      description: 'Compiled framework with minimal runtime',
      badges: ['No Virtual DOM', 'Reactive', 'SvelteKit'],
      versions: ['latest', '4.x', '3.x'],
    },
    {
      id: 'astro',
      name: 'Astro',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Astro.png',
      color: 'white',
      description: 'Content-focused static site generator',
      badges: ['Island Architecture', 'MPA', 'Zero JS by default'],
      versions: ['latest', '4.x', '3.x', '2.x'],
    },
  ];


  protected readonly frameworkUiLibraries: { [key: string]: any[] } = {
    angular: [
      {
        id: 'angularMaterial',
        name: 'Angular Material',
        icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6CY5okaihNPZJIw5tK0cCZd1JaiSsmcSRAA&s',
        description: 'Official Material Design components for Angular',
        versions: ['latest', '20.1','19.0','17.x', '16.x', '15.x', '14.x', '13.x', '12.x', '11.x'],
      },
      {
        id: 'primeng',
        name: 'PrimeNG',
        icon: 'https://i0.wp.com/www.primefaces.org/wp-content/uploads/2018/05/primeng-logo.png?ssl=1',
        description: 'Rich set of open source UI components for Angular',
        versions: ['latest', '17.x', '16.x'],
      },
      {
        id: 'ngBootstrap',
        name: 'NG Bootstrap',
        icon: 'https://avatars.githubusercontent.com/u/14283866?s=200&v=4',
        description: 'Angular widgets built with Bootstrap',
        versions: ['latest', '16.x', '15.x'],
      },
      {
        id: 'ngrx',
        name: 'NgRx',
        icon: 'https://ngrx.io/assets/images/badge.png',
        description: 'Reactive state management for Angular',
        versions: ['latest', '17.x', '16.x'],
      },
    ],

    // React specific UI libraries
    react: [
      {
        id: 'mui',
        name: 'Material UI',
        icon: 'https://icon.icepanel.io/Technology/svg/Material-UI.svg',
        description: 'React components for Material Design',
        versions: ['latest', '5.x', '4.x'],
      },
      {
        id: 'chakra',
        name: 'Chakra UI',
        icon: 'https://img.icons8.com/?size=512&id=r9QJ0VFFrn7T&format=png',
        description: 'Accessible component library',
        versions: ['latest', '3.x', '2.x', '1.x'],
      },
      {
        id: 'styledComponents',
        name: 'Styled Components',
        icon: 'https://avatars.githubusercontent.com/u/20658825?s=200&v=4',
        description: 'CSS-in-JS solution',
        versions: ['latest', '6.x', '5.x'],
      },
      {
        id: 'antDesign',
        name: 'Ant Design',
        icon: 'https://cdn.worldvectorlogo.com/logos/ant-design-2.svg',
        description: 'Enterprise-level UI design system',
        versions: ['latest', '5.x', '4.x'],
      },
    ],

    // Vue specific UI libraries
    vue: [
      {
        id: 'vuetify',
        name: 'Vuetify',
        icon: 'https://cdn.vuetifyjs.com/docs/images/brand-kit/v-logo.svg',
        description: 'Material Design Framework for Vue',
        versions: ['latest', '3.x', '2.x'],
      },
      {
        id: 'quasar',
        name: 'Quasar',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Quasar_Logo.png',
        description: 'High-performance material component library',
        versions: ['latest', '2.x', '1.x'],
      },
      {
        id: 'vueBootstrap',
        name: 'BootstrapVue',
        icon: 'https://bootstrap-vue.org//_nuxt/icons/icon_512x512.67aef2.png',
        description: 'Bootstrap components for Vue',
        versions: ['latest', '3.x', '2.x'],
      },
    ],

    // Svelte specific UI libraries
    svelte: [
      {
        id: 'svelteKit',
        name: 'SvelteKit',
        icon: 'https://icon.icepanel.io/Technology/svg/Svelte.svg',
        description: 'Framework for building web applications',
        versions: ['latest', '2.x', '1.x'],
      },
      {
        id: 'svelteMaterial',
        name: 'Svelte Material UI',
        icon: 'https://madewithsvelte.com/mandant/madewithsvelte/images/logo.png',
        description: 'Material UI components for Svelte',
        versions: ['latest', '7.x', '6.x'],
      },
    ],
  };

  /**
   * Common styling options available for all frameworks
   */
  protected readonly commonStylingOptions = [
    {
      id: 'tailwind',
      name: 'Tailwind CSS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
      description: 'Utility-first CSS framework',
      versions: ['latest', '3.x', '2.x'],
    },
    {
      id: 'scss',
      name: 'SCSS',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg',
      description: 'CSS with superpowers',
      versions: ['latest', '3.x', '2.x'],
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg',
      description: 'Responsive component library',
      versions: ['latest', '5.x', '4.x'],
    },
    {
      id: 'unocss',
      name: 'UnoCSS',
      icon: 'https://unocss.dev/logo.svg',
      description: 'Instant on-demand atomic CSS engine',
      versions: ['latest', '3.x', '2.x'],
    },
  ];

  /**
   * Get available styling options based on selected framework
   */
  protected get stylingOptions() {
    const selectedFramework = this.frontendForm()?.get('framework')?.value;
    const frameworkSpecificOptions = selectedFramework
      ? this.frameworkUiLibraries[selectedFramework] || []
      : [];

    return [...this.commonStylingOptions, ...frameworkSpecificOptions];
  }

  /**
   * Toggle a styling preference in multi-select mode
   */
  protected toggleStylingPreference(styleName: string): void {
    const currentStyles = [...this.selectedStylingPreferences()];
    const index = currentStyles.indexOf(styleName);
    
    if (index === -1) {
      currentStyles.push(styleName);
    } else {
      currentStyles.splice(index, 1);
    }
    
    this.stylingPreferencesChange.emit(currentStyles);
    this.frontendForm().get('styling')?.setValue(currentStyles);
  }

  /**
   * Selects a framework and sets its icon URL in the form
   * @param frameworkId The ID of the selected framework
   * @param iconUrl The icon URL of the selected framework
   */
  selectFramework(frameworkId: string, iconUrl: string): void {
    this.frontendForm()!.get('framework')?.setValue(frameworkId);
    this.frontendForm()!.get('frameworkIconUrl')?.setValue(iconUrl);
  }

  /**
   * Toggle advanced options visibility for the specified framework
   */
  protected toggleAdvancedOptions(frameworkId: string): void {
    this.advancedOptionsVisibleFor.update((current) =>
      current === frameworkId ? null : frameworkId
    );
  }

  /**
   * Check if advanced options are visible for a specific framework
   */
  protected isAdvancedOptionsVisible(frameworkId: string): boolean {
    return this.advancedOptionsVisibleFor() === frameworkId;
  }

  /**
   * Check if a styling preference is selected
   */
  protected isStylingSelected(style: string): boolean {
    return this.selectedStylingPreferences().includes(style);
  }

  /**
   * Frontend Features configuration list
   */
  protected readonly frontendFeatures = [
    {
      id: 'routing',
      name: 'Routing',
      description: 'Navigation management',
      icon: 'pi pi-compass',
      formControlName: 'features.routing'
    },
    {
      id: 'componentLibrary',
      name: 'Component Library',
      description: 'Pre-built UI components',
      icon: 'pi pi-box',
      formControlName: 'features.componentLibrary'
    },
    {
      id: 'testing',
      name: 'Testing',
      description: 'Unit & component tests',
      icon: 'pi pi-check-square',
      formControlName: 'features.testing'
    },
    {
      id: 'pwa',
      name: 'PWA',
      description: 'Progressive Web App',
      icon: 'pi pi-mobile',
      formControlName: 'features.pwa'
    },
    {
      id: 'seo',
      name: 'SEO',
      description: 'Search engine optimization',
      icon: 'pi pi-search',
      formControlName: 'features.seo'
    },
    {
      id: 'i18n',
      name: 'Internationalization',
      description: 'Multi-language support',
      icon: 'pi pi-globe',
      formControlName: 'features.i18n'
    }
  ];

  /**
   * Toggle a frontend feature
   */
  protected toggleFeature(formControlName: string): void {
    const control = this.frontendForm().get(formControlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  /**
   * Get feature value from form
   */
  protected getFeatureValue(formControlName: string): boolean {
    return this.frontendForm().get(formControlName)?.value || false;
  }

  /**
   * Toggle styling preference with ToggleSwitch
   */
  protected toggleStylingWithSwitch(styleName: string, event: any): void {
    const currentStyles = [...this.selectedStylingPreferences()];
    const index = currentStyles.indexOf(styleName);
    
    if (event.checked && index === -1) {
      currentStyles.push(styleName);
    } else if (!event.checked && index !== -1) {
      currentStyles.splice(index, 1);
    }
    
    this.stylingPreferencesChange.emit(currentStyles);
    this.frontendForm().get('styling')?.setValue(currentStyles);
  }

  /**
   * Get versions for the selected framework
   */
  protected getFrameworkVersions(): string[] {
    const selectedFramework = this.frontendForm().get('framework')?.value;
    // Handle nested structure of versionOptions
    if (selectedFramework && this.versionOptions()![selectedFramework]) {
      // Get versions from the first category key or return default
      const categories = Object.keys(this.versionOptions()[selectedFramework]);
      if (categories.length > 0) {
        return (
          this.versionOptions()[selectedFramework][categories[0]] || ['latest']
        );
      }
    }
    return ['latest'];
  }
}
