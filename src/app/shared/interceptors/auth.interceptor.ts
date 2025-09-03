import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { isPlatformServer } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

/**
 * Interceptor function to add JWT to requests.
 *
 * This function intercepts outgoing HTTP requests and adds an Authorization header
 * with a bearer token if one is available. It's designed to work with Angular's
 * functional interceptor pattern. It will automatically add the 'Authorization' header
 * to all HTTP requests. It also handles Server-Side Rendering (SSR) by checking
 * the platform and skipping auth logic in a server context.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  console.log('Auth Interceptor: Intercepting request:', req.url);
  const platformId = inject(PLATFORM_ID);
  const tokenService = inject(TokenService);

  // Skip interception for server-side rendering
  if (isPlatformServer(platformId)) {
    console.log('Auth Interceptor: Skipping interception for server-side rendering');
    return next(req);
  }

  // Exclude auth endpoints from interception
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    console.log('Auth Interceptor: Skipping interception for auth endpoints');
    return next(req);
  }

  // Wait for auth to be ready, then proceed with token logic
  return from(tokenService.waitForAuthReady()).pipe(
    switchMap(() => {
      // Always get a fresh token for critical requests
      return from(tokenService.getTokenAsync()).pipe(
        switchMap((freshToken: string | null) => {
          if (!freshToken) {
            console.warn('Auth Interceptor: No authentication token available for request:', req.url);
            return next(req);
          }
          
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${freshToken}`),
          });
          
          return next(authReq).pipe(
            catchError((error) => {
              // If we get 401/403, try to refresh token once more
              if (error.status === 401 || error.status === 403) {
                return from(tokenService.refreshToken()).pipe(
                  switchMap((refreshedToken: string | null) => {
                    if (!refreshedToken) {
                      throw error;
                    }
                    
                    const retryReq = req.clone({
                      headers: req.headers.set('Authorization', `Bearer ${refreshedToken}`),
                    });
                    
                    return next(retryReq);
                  }),
                  catchError(() => {
                    console.error('Auth Interceptor: Token refresh failed, throwing original error');
                    throw error;
                  })
                );
              }
              throw error;
            })
          );
        }),
        catchError((error) => {
          console.error('Auth Interceptor: Error getting fresh token:', error);
          return next(req);
        })
      );
    }),
    catchError((error) => {
      console.error('Error waiting for auth ready in interceptor:', error);
      // If auth ready fails, proceed without token
      return next(req);
    })
  );
};
