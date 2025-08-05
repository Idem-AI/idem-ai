import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ProjectModel } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { AsyncPipe } from '@angular/common';
import { Loader } from '../../../../components/loader/loader';
import { AuthService } from '../../../auth/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { first, Observable } from 'rxjs';
import { ProjectCard } from '../../components/project-card/project-card';
import { CookieService } from '../../../../shared/services/cookie.service';

@Component({
  selector: 'app-projects-list',
  imports: [Loader, AsyncPipe, ProjectCard, RouterLink],
  templateUrl: './projects-list.html',
  styleUrl: './projects-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsList implements OnInit {
  // Services
  private readonly projectService = inject(ProjectService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Data signals and state
  userProjects$!: Observable<ProjectModel[]>;
  protected readonly recentProjects = signal<ProjectModel[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isMenuOpen = signal(false);
  protected readonly isDropdownOpen = signal(false);
  protected readonly user$ = this.auth.user$;
  cookieService = inject(CookieService);
  @ViewChild('menu') menuRef!: ElementRef;
  ngOnInit() {
    try {
      this.user$.pipe(first()).subscribe((user) => {
        if (user) {
          this.isLoading.set(true);
          this.userProjects$ = this.projectService.getProjects();
          this.userProjects$.subscribe((projects) => {
            this.recentProjects.set(
              projects
                .slice()
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 3)
            );
            this.isLoading.set(false);
          });
        } else {
          console.log('User not found');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      this.isLoading.set(false);
    }
  }

  /**
   * Toggle main menu visibility
   */
  protected toggleMenu() {
    this.isMenuOpen.update((open) => !open);
  }

  /**
   * Toggle user dropdown menu visibility
   */
  protected toggleDropdown() {
    this.isDropdownOpen.update((open) => !open);
  }

  /**
   * Logout user and navigate to login page
   */
  protected logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to project dashboard and set project cookie
   */
  protected openProjectDashboard(projectId: string) {
    this.isDropdownOpen.set(false);
    this.cookieService.set('projectId', projectId);
    this.router.navigate([`console/dashboard/${projectId}`]);
  }
}
