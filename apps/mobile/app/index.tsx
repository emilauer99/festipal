import { StyleSheet, Text, View } from 'react-native';
import { Trans } from '@lingui/react/macro';
import { LOCALE_LABELS, type Locale } from '@festipal/i18n';

import { i18n } from '../lib/i18n';

/**
 * Tracer screen (03-02-PLAN.md Task 1) — proves two things end-to-end:
 * 1. Metro resolves `@festipal/*` workspace packages (LOCALE_LABELS import).
 * 2. The first UI string in the repo is a real Lingui macro, not a bare
 *    JSX string literal (I18N-01 from the first commit).
 */
export default function TracerScreen() {
  const activeLocaleLabel = LOCALE_LABELS[i18n.locale as Locale] ?? i18n.locale;

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>festipal</Text>
      <Text style={styles.body}>
        <Trans>Welcome to festipal</Trans>
      </Text>
      <Text style={styles.body}>{activeLocaleLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 16,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
});
