import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize if DSN is configured
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      beforeSend(event, hint) {
        // Filter out some errors
        const error = hint.originalException;

        // Ignore network errors in development
        if (import.meta.env.MODE === 'development' && error?.message?.includes('Failed to fetch')) {
          return null;
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized');
  } else {
    console.log('⚠️  Sentry not initialized - VITE_SENTRY_DSN not configured');
  }
}
