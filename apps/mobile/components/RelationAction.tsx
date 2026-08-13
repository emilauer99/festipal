import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { UserPlus } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Relation } from '@quiks/contracts';

import { useFriendMutations } from '../lib/use-friend-mutations';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 18;

export type RelationActionProps = {
  relation: Relation;
  /** The COUNTERPART's accountId — never the caller's own. */
  accountId: string;
  onDone?: () => void;
};

/**
 * The ONE mapping `relation` -> action (D-04), shared by the search hit's
 * trailing slot and (from 08-05) the scan confirmation card.
 *
 * 08-01 Task 1 wires only the `none` branch end to end — the tracer's
 * behavior contract is exactly "a `none` hit's tap sends a real request".
 * Every other relation renders `null` here rather than a button that could
 * ever tap-fail, which already satisfies the "no guaranteed-failing tap"
 * prohibition for this task's slice; 08-01 Task 2 completes
 * `requestIncoming`/`requestOutgoing`/`friends`/`self` with an exhaustive
 * switch (no `default`, so a future `Relation` value breaks the typecheck
 * instead of silently falling through).
 */
export function RelationAction({ relation, accountId, onDone }: RelationActionProps) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const { sendRequest, pendingTargetId } = useFriendMutations();
  const isPending = pendingTargetId === accountId;

  if (relation === 'none') {
    return (
      <Pressable
        style={styles.primaryPill}
        disabled={isPending}
        onPress={() => {
          sendRequest(accountId);
          onDone?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={t`Add`}
        accessibilityState={{ disabled: isPending }}
      >
        <UserPlus size={ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
        <Text style={[styles.primaryPillText, { fontFamily: buttonFont }]}>
          <Trans>Add</Trans>
        </Text>
      </Pressable>
    );
  }

  return null;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    primaryPill: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-2'],
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    primaryPillText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
