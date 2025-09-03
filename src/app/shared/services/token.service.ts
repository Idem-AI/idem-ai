import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { filter, take } from 'rxjs/operators';

/**
 * Service responsible for managing authentication tokens.
 * This service is used by both AuthService and AuthInterceptor to avoid circular dependencies.
 */
@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private auth = inject(Auth);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private authReadySubject = new BehaviorSubject<boolean>(false);

  // Observable that emits the current token
  public token$ = this.tokenSubject.asObservable();
  
  // Observable that emits when auth is ready (true when initialized)
  public authReady$ = this.authReadySubject.asObservable();

  constructor() {
    // Listen for auth state changes and update token accordingly
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Auth state changed: User authenticated, refreshing token');
        this.refreshToken(user);
      } else {
        console.log(
          'Auth state changed: User not authenticated, clearing token'
        );
        this.clearToken();
      }
      
      // Mark auth as ready after first state change
      if (!this.authReadySubject.value) {
        console.log('Auth initialization complete');
        this.authReadySubject.next(true);
      }
    });

    // Initialize token immediately if user is already authenticated
    this.initializeToken();
  }

  /**
   * Initialize token on service startup
   */
  private async initializeToken(): Promise<void> {
    try {
      if (this.auth.currentUser) {
        console.log('Initializing token for existing user');
        await this.refreshToken(this.auth.currentUser);
      } else {
        console.log('No user found during token initialization');
      }
    } catch (error) {
      console.error('Error during token initialization:', error);
    }
  }

  /**
   * Manually refresh token for current user
   */
  public async refreshToken(user?: User): Promise<string | null> {
    try {
      const currentUser = user || this.auth.currentUser;
      if (!currentUser) {
        this.clearToken();
        console.log('User not found');
        return null;
      }
      console.log('User found');

      const token = await currentUser.getIdToken(true);
      this.setToken(token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get the current token value synchronously
   * Returns the cached token from BehaviorSubject for immediate access
   */
  public getToken(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Get the current token value asynchronously
   * Waits for Firebase Auth to be ready and returns fresh token
   */
  public async getTokenAsync(): Promise<string | null> {
    try {
      if (!this.auth.currentUser) {
        console.log('TokenService: No current user available');
        return null;
      }
      
      // Force refresh to get a fresh token
      const token = await this.auth.currentUser.getIdToken(true);
      if (token) {
        this.setToken(token);
        console.log('TokenService: Fresh token obtained, length:', token.length);
      }
      return token || null;
    } catch (error) {
      console.error('Error getting token async:', error);
      return null;
    }
  }

  /**
   * Set a new token
   */
  private setToken(token: string): void {
    this.tokenSubject.next(token);
  }

  /**
   * Clear the token when user logs out
   */
  public clearToken(): void {
    this.tokenSubject.next(null);
  }

  /**
   * Wait for auth to be ready
   * Returns a Promise that resolves when Firebase Auth has initialized
   */
  public waitForAuthReady(): Promise<void> {
    return this.authReady$.pipe(
      filter(ready => ready === true),
      take(1)
    ).toPromise().then(() => void 0);
  }
}
