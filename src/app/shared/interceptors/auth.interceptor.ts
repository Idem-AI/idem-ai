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
  const platformId = inject(PLATFORM_ID);
  const tokenService = inject(TokenService);

  // Skip interception for server-side rendering
  if (isPlatformServer(platformId)) {
    return next(req);
  }

  // Exclude auth endpoints from interception
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh')
  ) {
    return next(req);
  }

  // Wait for auth to be ready, then proceed with token logic
  return from(tokenService.waitForAuthReady()).pipe(
    switchMap(() => {
      // Get token after auth is ready
      const token = tokenService.getToken();
      
      if (!token) {
        // No token available, try to get fresh token asynchronously as fallback
        return from(tokenService.getTokenAsync()).pipe(
          switchMap((freshToken: string | null) => {
            if (!freshToken) {
              console.warn('No authentication token available for request:', req.url);
              return next(req);
            }
            
            const authReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${freshToken}`),
            });
            
            return next(authReq);
          }),
          catchError((error) => {
            console.error('Error in auth interceptor fallback:', error);
            return next(req);
          })
        );
      }

      // Token available, use it
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });

      return next(authReq);
    }),
    catchError((error) => {
      console.error('Error waiting for auth ready in interceptor:', error);
      // If auth ready fails, proceed without token
      return next(req);
    })
  );
};
