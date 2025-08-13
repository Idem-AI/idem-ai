import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';

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

  // Observable that emits the current token
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    // Listen for auth state changes and update token accordingly
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.refreshToken(user);
      } else {
        this.clearToken();
      }
    });
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
      console.log('Token:', token);
      this.setToken(token);
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Get the current token value synchronously
   */
  public async getToken(): Promise<string | null> {
    const token = await this.auth.currentUser?.getIdToken();
    return token || null;
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
}
