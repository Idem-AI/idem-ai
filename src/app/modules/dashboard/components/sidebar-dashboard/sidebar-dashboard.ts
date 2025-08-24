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
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { ProjectService } from '../../services/project.service';
import { ProjectModel } from '../../models/project.model';
import { SelectElement } from '../../pages/create-project/datas';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-sidebar-dashboard',
  templateUrl: './sidebar-dashboard.html',
  styleUrls: ['./sidebar-dashboard.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BetaBadgeComponent,
    QuotaDisplayComponent,
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

  // Navigation items
  protected readonly navigationItems = signal([
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      route: 'console/dashboard',
      isActive: false,
    },
    {
      label: 'Branding',
      icon: 'pi pi-palette',
      route: 'console/branding',
      isActive: false,
    },
    {
      label: 'Business Plan',
      icon: 'pi pi-calendar',
      route: 'console/business-plan',
      isActive: false,
    },
    {
      label: 'Diagrams',
      icon: 'pi pi-chart-line',
      route: 'console/diagrams',
      isActive: false,
    },
    {
      label: 'Development',
      icon: 'pi pi-code',
      route: 'console/development',
      isActive: false,
    },
    {
      label: 'Deployment',
      icon: 'pi pi-globe',
      route: 'console/deployments',
      isActive: false,
    },
  ]);

  // Signals for UI State
  isLoading = signal(true);
  isMenuOpen = signal(false);
  isDropdownOpen = signal(false);
  protected readonly isSidebarCollapsed = signal(false);
  protected readonly isMobileDrawerOpen = signal(false);
  protected readonly isProjectSelectorOpen = signal(false);

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
      code: 'all-projects',
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
    // Menu items are now handled by navigationItems signal
    this.updateActiveStates();
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
              this.router.navigate([`console/projects`], {
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
            this.router.navigate([`project/create`], {
              replaceUrl: true,
            });
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

  onProjectChange(project: SelectElement) {
    const projectId = project.code;
    if (projectId) {
      // Check if "View All Projects" option was selected
      if (projectId === 'all-projects') {
        // Navigate to projects list view
        this.router.navigate(['/console/projects']);
        this.isProjectSelectorOpen.set(false);
        return;
      }

      // Regular project selection - save to cookie
      // Also set selectedProject signal so UI updates immediately
      this.selectedProject.set(project);
      this.cookieService.set('projectId', projectId);
      this.projectIdFromCookie.set(projectId);
      this.isProjectSelectorOpen.set(false);

      // Navigate to the project dashboard
      this.router.navigate([`/console/dashboard`]);
    }
  }

  updateSidebarRoutes() {
    this.updateActiveStates();
  }

  /**
   * Updates active states for navigation items
   */
  private updateActiveStates(): void {
    const currentPath = this.currentRoute();
    const items = this.navigationItems();

    const updatedItems = items.map((item) => ({
      ...item,
      isActive: currentPath.includes(`/${item.route}`),
    }));

    this.navigationItems.set(updatedItems);
  }

  /**
   * Toggles project selector dropdown
   */
  toggleProjectSelector(): void {
    this.isProjectSelectorOpen.update((open) => !open);
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
    // Normalize to absolute URL and navigate reliably
    const url = path.startsWith('/') ? path : `/${path}`;
    this.router.navigateByUrl(url);
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
    const projectSelector = targetElement.closest('.project-selector');

    if (this.isDropdownOpen() && !dropdownButton && !dropdownMenu) {
      this.isDropdownOpen.set(false);
    }

    if (this.isProjectSelectorOpen() && !projectSelector) {
      this.isProjectSelectorOpen.set(false);
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
