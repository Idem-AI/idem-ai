import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
  OnInit,
  signal,
  computed,
  DestroyRef,
  effect,
  Output,
  EventEmitter,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MenuItem } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { Select, SelectChangeEvent } from 'primeng/select';
import { ProjectService } from '../../services/project.service';
import { ProjectModel } from '../../models/project.model';
import { SelectElement } from '../../pages/create-project/datas';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { first, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { CookieService } from '../../../../shared/services/cookie.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BetaBadgeComponent } from '../../../../shared/components/beta-badge/beta-badge';
import { QuotaDisplayComponent } from '../../../../shared/components/quota-display/quota-display';
import { QuotaService } from '../../../../shared/services/quota.service';
import {
  QuotaInfoResponse,
  QuotaDisplayData,
  BetaRestrictions,
  QuotaStatus,
} from '../../../../shared/models/quota.model';
// import { BetaBadgeComponent } from '../../../../shared/components/beta-badge/beta-badge';

@Component({
  selector: 'app-sidebar-dashboard',
  templateUrl: './sidebar-dashboard.html',
  styleUrls: ['./sidebar-dashboard.css'],
  standalone: true,
  imports: [
    PanelMenu,
    Select,
    CommonModule,
    FormsModule,
    BetaBadgeComponent,
    QuotaDisplayComponent,
    DrawerModule,
  ],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('300ms ease-in', style({ transform: 'translateY(0%)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateY(-100%)' })),
      ]),
    ]),
    trigger('sidebarExpand', [
      state(
        'expanded',
        style({
          width: '260px',
        })
      ),
      state(
        'collapsed',
        style({
          width: '80px',
        })
      ),
      transition('expanded <=> collapsed', [animate('300ms ease-in-out')]),
    ]),
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0, display: 'none' })),
      transition('visible <=> hidden', [animate('200ms ease-in-out')]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarDashboard implements OnInit {
  // Services and Router
  private readonly auth = inject(AuthService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly cookieService = inject(CookieService);
  private readonly quotaService = inject(QuotaService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for UI State
  items = signal<MenuItem[]>([]);
  isLoading = signal(true);
  isMenuOpen = signal(false);
  isDropdownOpen = signal(false);
  protected readonly isSidebarCollapsed = signal(false);
  protected readonly isMobileDrawerOpen = signal(false);

  // Quota Signals (managed locally)
  protected readonly quotaInfo = signal<QuotaInfoResponse | null>(null);
  protected readonly quotaDisplay = signal<QuotaDisplayData | null>(null);
  protected readonly isBeta = signal<boolean>(false);
  protected readonly betaRestrictions = signal<BetaRestrictions | null>(null);
  protected readonly isQuotaLoading = signal<boolean>(true);

  // Computed values for UI states
  protected readonly sidebarState = computed(() =>
    this.isSidebarCollapsed() ? 'collapsed' : 'expanded'
  );

  protected readonly textVisibility = computed(() =>
    this.isSidebarCollapsed() ? 'hidden' : 'visible'
  );

  // Output event to notify parent components of sidebar state changes
  @Output() sidebarCollapsedChange = new EventEmitter<boolean>();

  // User and Project Data Signals
  protected readonly user = toSignal(this.auth.user$);
  private readonly _userProjects = signal<ProjectModel[]>([]);
  protected readonly selectedProject = signal<SelectElement | undefined>(
    undefined
  );
  protected readonly projectIdFromCookie = signal<string | null>(null);
  protected readonly currentRoute = signal<string>('');

  // Computed signal for dropdown project list
  dropDownProjects = computed(() => {
    // Add "View All Projects" as the first option
    const allProjectsOption = {
      name: 'View All Projects',
      code: 'all-projects'
    };
    
    // Get the regular project options
    const projectOptions = this._userProjects().map((p) => ({
      name: p.name,
      code: p.id!,
    }));
    
    // Return the special option at the top followed by the regular projects
    return [allProjectsOption, ...projectOptions];
  });

  @ViewChild('menu') menuRef!: ElementRef;

  constructor() {
    // Initialize projectIdFromCookie from saved cookie
    const savedProjectId = this.cookieService.get('projectId');
    if (savedProjectId) {
      this.projectIdFromCookie.set(savedProjectId);
    }

    // Initialize sidebar collapsed state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState) {
      this.isSidebarCollapsed.set(savedSidebarState === 'true');
    }

    // Track current route for active menu highlighting
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.urlAfterRedirects);
        // Update menu items to reflect active state
        this.updateSidebarRoutes();
      }
    });

    // Effect to update sidebar menu when selectedProject changes
    effect(() => {
      if (this.selectedProject()) {
        this.updateSidebarRoutes();
      }
    });

    // Effect to react to projectIdFromCookie changes and user's projects list
    effect(
      () => {
        const projects = this._userProjects();
        const cookieId = this.projectIdFromCookie();
        const isLoadingProjects = this.isLoading();

        if (isLoadingProjects) {
          return; // Wait for projects to load
        }

        if (cookieId) {
          const projectFromCookie = projects.find((p) => p.id === cookieId);
          if (projectFromCookie) {
            // Valid project from cookie - set it as selected
            this.selectedProject.set({
              name: projectFromCookie.name,
              code: cookieId,
            });
          } else {
            // Invalid project ID in cookie
            if (projects.length > 0) {
              console.warn(
                `Project ID '${cookieId}' from cookie not found. Using first project instead.`
              );
              const firstProject = projects[0];
              // Set first project as selected and save to cookie
              this.selectedProject.set({
                name: firstProject.name,
                code: firstProject.id!,
              });
              this.cookieService.set('projectId', firstProject.id!);
            } else {
              // No projects available, and cookie ID is invalid
              this.selectedProject.set(undefined);
              this.cookieService.remove('projectId');
            }
          }
        } else {
          // No project ID in cookie
          if (projects.length > 0) {
            // Select the first project by default if no specific project in cookie
            const firstProject = projects[0];
            this.selectedProject.set({
              name: firstProject.name,
              code: firstProject.id!,
            });
            this.cookieService.set('projectId', firstProject.id!);
          } else {
            // No projects and no cookie ID
            this.selectedProject.set(undefined);
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit() {
    this.initializeMenu();
    this.loadProjects();
  }

  /**
   * Loads quota information from the QuotaService
   */
  private loadQuotaInfo(): void {
    this.isQuotaLoading.set(true);

    this.quotaService
      .getQuotaInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info: QuotaInfoResponse) => {
          this.quotaInfo.set(info);
          this.isBeta.set(info.isBeta || false);
          this.processQuotaDisplayData(info);
          this.isQuotaLoading.set(false);
        },
        error: () => {
          this.isQuotaLoading.set(false);
        },
      });
  }

  /**
   * Processes quota info into display data
   */
  private processQuotaDisplayData(info: QuotaInfoResponse): void {
    if (!info) return;

    const dailyPercentage = (info.dailyUsage / info.dailyLimit) * 100;
    const weeklyPercentage = (info.weeklyUsage / info.weeklyLimit) * 100;

    const displayData: QuotaDisplayData = {
      dailyPercentage,
      weeklyPercentage,
      dailyStatus: this.getQuotaStatus(dailyPercentage),
      weeklyStatus: this.getQuotaStatus(weeklyPercentage),
      canUseFeature: info.remainingDaily > 0 && info.remainingWeekly > 0,
    };

    this.quotaDisplay.set(displayData);

    // Set beta restrictions if user is in beta
    if (info.isBeta) {
      this.betaRestrictions.set({
        maxStyles: 3,
        maxResolution: '1024x1024',
        maxOutputTokens: 2000,
        restrictedPrompts: [],
        allowedFeatures: ['basic'],
      });
    }
  }

  /**
   * Determines quota status based on percentage
   */
  private getQuotaStatus(percentage: number): QuotaStatus {
    if (percentage >= 100) return QuotaStatus.EXCEEDED;
    if (percentage >= 80) return QuotaStatus.WARNING;
    return QuotaStatus.AVAILABLE;
  }

  /**
   * Initializes the menu items
   */
  private initializeMenu(): void {
    // Initialize menu items
    this.items.set([
      {
        label: 'Dashboard',
        icon: 'pi pi-fw pi-home',
        command: () => this.navigateTo('console/dashboard'),
      },
      {
        label: 'Branding',
        icon: 'pi pi-fw pi-palette',
        command: () => this.navigateTo('console/branding'),
      },
      {
        label: 'Business Plan',
        icon: 'pi pi-fw pi-calendar',
        command: () => this.navigateTo('console/business-plan'),
      },
      {
        label: 'Diagrams',
        icon: 'pi pi-fw pi-chart-line',
        command: () => this.navigateTo('console/diagrams'),
      },
      {
        label: 'Developement',
        icon: 'pi pi-fw pi-code',
        command: () => this.navigateTo('console/development'),
      },
      {
        label: 'Tests',
        icon: 'pi pi-fw pi-check-square',
        command: () => this.navigateTo('console/tests'),
      },
      {
        label: 'Deployment',
        icon: 'pi pi-fw pi-globe',
        command: () => this.navigateTo('console/deployments'),
      },
    ]);
  }

  /**
   * Loads projects from the ProjectService
   */
  private loadProjects(): void {
    this.isLoading.set(true);
    this.auth.user$
      .pipe(
        first(),
        switchMap((user) => {
          if (!user) {
            console.log('User not authenticated.');
            this._userProjects.set([]);
            this.isLoading.set(false);
            return EMPTY;
          }
          return this.projectService.getProjects(); // Fetches projects
        })
      )
      .subscribe({
        next: (projects) => {
          this._userProjects.set(projects);
          const initialCookieId = this.cookieService.get('projectId'); // Get ID from cookie
          this.loadQuotaInfo();
          if (projects.length > 0) {
            if (!initialCookieId) {
              // No project ID in cookie on initial load, save to cookie and navigate to the first project
              console.log(
                'No initial project ID in cookie, navigating to first project.'
              );
              const firstProject = projects[0];
              this.cookieService.set('projectId', firstProject.id!);
              this.router.navigate([`console/dashboard/${firstProject.id!}`], {
                replaceUrl: true,
              });
            } else {
              const projectExists = projects.find(
                (p) => p.id === initialCookieId
              );
              if (!projectExists) {
                // Initial project ID from URL is invalid (not in user's list)
                console.warn(
                  `Initial project ID '${initialCookieId}' not found. Navigating to first project.`
                );
                const firstProject = projects[0];
                this.cookieService.set('projectId', firstProject.id!);
                this.router.navigate(
                  [`console/dashboard/${firstProject.id!}`],
                  { replaceUrl: true }
                );
              }
              // If initialCookieId is valid, the effect will handle setting selectedProject.
            }
          } else {
            // No projects for the user
            console.log('User has no projects.');
            // If there was an initialCookieId, it's effectively invalid now.
            // The effect will set selectedProject to undefined.
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching projects in ngOnInit:', err);
          this._userProjects.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onProjectChange(event: SelectChangeEvent) {
    const projectId = event.value?.code;
    if (projectId) {
      // Check if "View All Projects" option was selected
      if (projectId === 'all-projects') {
        // Navigate to projects list view
        this.router.navigate(['/console/projects']);
        return;
      }
      
      // Regular project selection - save to cookie
      // Also set selectedProject signal so UI updates immediately
      this.selectedProject.set(event.value);
      this.cookieService.set('projectId', projectId);
      this.projectIdFromCookie.set(projectId);

      // Navigate to the project dashboard
      this.router.navigate([`/console/dashboard`]);
    }
  }

  updateSidebarRoutes() {
    const selectedProjectId = this.selectedProject()?.code;
    if (!selectedProjectId) return;

    const currentPath = this.currentRoute();

    // Helper function to determine if a route is active
    const isRouteActive = (path: string): boolean => {
      // Handle special case for dashboard which might be just /console/dashboard
      if (path === 'console/dashboard') {
        return currentPath.includes(`/console/dashboard`);
      }
      return currentPath.includes(`/${path}`);
    };

    // Create style class based on collapsed state and active route
    const getStyleClass = (path: string): string => {
      const isCollapsed = this.isSidebarCollapsed()
        ? 'sidebar-item-collapsed'
        : '';
      const isActive = isRouteActive(path) ? 'sidebar-item-active' : '';
      return `${isCollapsed} ${isActive}`.trim();
    };

    // Create menu items with expanded style options and active route highlight
    this.items.set([
      {
        label: this.isSidebarCollapsed() ? '' : 'Dashboard',
        icon: 'pi pi-fw pi-home',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo('/console/dashboard');
        },
        styleClass: getStyleClass('/console/dashboard'),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Projects',
        icon: 'pi pi-fw pi-briefcase',
        items: [
          {
            label: 'All Projects',
            icon: 'pi pi-fw pi-list',
            command: () => {
              this.isMobileDrawerOpen.set(false);
              this.navigateTo('/console/projects');
            },
            styleClass: getStyleClass('/console/projects'),
          },
          {
            label: 'Create Project',
            icon: 'pi pi-fw pi-plus',
            command: () => {
              this.isMobileDrawerOpen.set(false);
              this.navigateTo('/console/projects/create');
            },
            styleClass: getStyleClass('/console/projects/create'),
          },
        ],
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Branding',
        icon: 'pi pi-fw pi-palette',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`/console/projects/${this.selectedProject()?.code}/branding`);
        },
        styleClass: getStyleClass(`/console/projects/${this.selectedProject()?.code}/branding`),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Business Plan',
        icon: 'pi pi-fw pi-chart-line',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`/console/projects/${this.selectedProject()?.code}/business-plan`);
        },
        styleClass: getStyleClass(`/console/projects/${this.selectedProject()?.code}/business-plan`),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Diagrams',
        icon: 'pi pi-fw pi-sitemap',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`/console/projects/${this.selectedProject()?.code}/diagrams`);
        },
        styleClass: getStyleClass(`/console/projects/${this.selectedProject()?.code}/diagrams`),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Developement',
        icon: 'pi pi-fw pi-code',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`console/development`);
        },
        styleClass: getStyleClass('console/development'),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Tests',
        icon: 'pi pi-fw pi-check-square',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`/console/tests`);
        },
        styleClass: getStyleClass('console/tests'),
      },
      {
        label: this.isSidebarCollapsed() ? '' : 'Deployment',
        icon: 'pi pi-fw pi-globe',
        command: () => {
          this.isMobileDrawerOpen.set(false);
          this.navigateTo(`/console/deployments`);
        },
        styleClass: getStyleClass('console/deployments'),
      },
    ]);
  }

  toggleMenu() {
    this.isMenuOpen.update((open) => !open);
  }

  toggleMobileDrawer() {
    this.isMobileDrawerOpen.update((open) => !open);
  }

  toggleDropdown() {
    this.isDropdownOpen.update((open) => !open);
  }

  navigateTo(path: string) {
    this.isDropdownOpen.set(false);
    this.isMobileDrawerOpen.set(false); // Close mobile drawer on navigation
    // Ne pas ajouter de slash car les chemins de menu incluent déjà 'console/'
    this.router.navigate([path]);
  }

  logout() {
    this.isDropdownOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (
      this.isMenuOpen() &&
      this.menuRef &&
      !this.menuRef.nativeElement.contains(event.target)
    ) {
      this.isMenuOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutsideDropdown(targetElement: HTMLElement) {
    const dropdownButton = targetElement.closest('button.flex.items-center');
    const dropdownMenu = targetElement.closest('.fixed.right-0.mt-2');

    if (this.isDropdownOpen() && !dropdownButton && !dropdownMenu) {
      this.isDropdownOpen.set(false);
    }
  }

  /**
   * Toggles the sidebar between expanded and collapsed states
   */
  toggleSidebar() {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
    // Update menu items to reflect the new state
    this.updateSidebarRoutes();
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', String(this.isSidebarCollapsed()));
    // Emit event to parent component
    this.sidebarCollapsedChange.emit(this.isSidebarCollapsed());
  }
}
