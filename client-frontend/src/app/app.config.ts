import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import { ActivatedRouteSnapshot, provideRouter, withViewTransitions } from '@angular/router';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import {routes} from './routes';
import {authInterceptor} from './services/auth-interceptor';

// How long the sidebar/section cascade keeps going after the pan (last item's delay plus its duration).
const ARRIVAL_TAIL_MS = 1200;

const leafPath = (route: ActivatedRouteSnapshot) => {
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.routeConfig?.path ?? '';
};

// Two navigations are animated (styles under html.auth-handoff / html.auth-arrive / html.auth-swap in styles.css):
// signing in, where the sign-in screen pans away left and the dashboard's sidebar and sections cascade in, and
// switching between sign-in and sign-up, where only the form cross-fades.
// Every other navigation swaps instantly as before.
const signInTransition = withViewTransitions({
  skipInitialTransition: true,
  onViewTransitionCreated: ({ transition, from, to }) => {
    const root = document.documentElement;
    const auth = ['login', 'signup'];
    if (auth.includes(leafPath(from)) && auth.includes(leafPath(to))) {
      root.classList.add('auth-swap');
      transition.finished.finally(() => root.classList.remove('auth-swap'));
      return;
    }
    if (leafPath(from) !== 'login' || leafPath(to) !== 'dashboard') {
      transition.skipTransition();
      return;
    }
    // auth-arrive drives the cascade on the real page, which carries on after the transition itself has finished.
    root.classList.add('auth-handoff', 'auth-arrive');
    transition.finished.finally(() => {
      root.classList.remove('auth-handoff');
      setTimeout(() => root.classList.remove('auth-arrive'), ARRIVAL_TAIL_MS);
    });
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, signInTransition),
    provideTanStackQuery(new QueryClient({
      defaultOptions: {
        queries: {
          // Treat data as fresh briefly so moving between pages reuses it instead of refetching.
          staleTime: 10_000,
          retry: 1,
        },
      },
    })),
  ]
};
