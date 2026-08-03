import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@lingui/react';

import { queryClient } from '../lib/query-client';
import { activateUiLocale, i18n } from '../lib/i18n';

// D-04: splash/icon stay a plain "festipal" wordmark placeholder (no branding
// assets this phase) — held until the UI locale (ADR-012 axis 1) resolves.
// The three-state auth guard (unauthenticated / authenticated-no-profile /
// authenticated) is added in Plan 03 — this tracer layout holds only the
// splash gate + shared providers.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function bootstrap() {
      const deviceLocales = Localization.getLocales().map((locale) => locale.languageTag);
      await activateUiLocale(deviceLocales);
      await SplashScreen.hideAsync();
    }
    void bootstrap();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <Stack />
      </I18nProvider>
    </QueryClientProvider>
  );
}
