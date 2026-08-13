import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { Check, UserPlus } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Relation } from '@quiks/contracts';

import { useFriendMutations } from '../lib/use-friend-mutations';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 18;

/**
 * The same dampening factor `ListRow`/the quiks-code card's Pattern-A button
 * already use for "inactive while X" — reused here for "pending", not
 * reinvented. Pressable's own `disabled` prop stops the tap but produces no
 * visual change on its own, which read as a dead/broken button in the
 * on-device tracer check (08-01 Task 1 checkpoint feedback) — this is the
 * fix, kept to an opacity change only, no spinner (UI-SPEC specifies no
 * loading affordance for this slot; the real feedback is the state swap
 * after the mutation settles).
 */
const PENDING_OPACITY = 0.45;

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
 * Exhaustive `switch` over the five `Relation` values, deliberately WITHOUT
 * a `default` branch: a future sixth value breaks this file's typecheck
 * instead of silently falling through to nothing.
 *
 * `requestIncoming`'s `Annehmen` calls the SAME `acceptRequest` (and the
 * same `friendKeys.all` invalidation) that 08-02's Requests section will
 * call — one definition, two call sites, never two code paths for the same
 * accept (D-04's explicit consequence, `use-friend-mutations.ts`).
 */
export function RelationAction({ relation, accountId, onDone }: RelationActionProps) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const chipFont = fontFamilyForRole('label', fontsReady);
  const { sendRequest, acceptRequest, pendingTargetId } = useFriendMutations();
  const isPending = pendingTargetId === accountId;

  switch (relation) {
    case 'none':
      return (
        <Pressable
          style={[styles.primaryPill, isPending ? styles.pending : null]}
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

    case 'requestIncoming':
      return (
        <Pressable
          style={[styles.primaryPill, isPending ? styles.pending : null]}
          disabled={isPending}
          onPress={() => {
            acceptRequest(accountId);
            onDone?.();
          }}
          accessibilityRole="button"
          accessibilityLabel={t`Accept`}
          accessibilityState={{ disabled: isPending }}
        >
          <Check size={ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
          <Text style={[styles.primaryPillText, { fontFamily: buttonFont }]}>
            <Trans>Accept</Trans>
          </Text>
        </Pressable>
      );

    // Static, NOT Pressable — no tap exists here that would be guaranteed to
    // fail (D-04 prohibition).
    case 'requestOutgoing':
      return (
        <View style={styles.staticChip} accessibilityLabel={t`Requested`}>
          <Text style={[styles.staticChipText, { fontFamily: chipFont }]}>
            <Trans>Requested</Trans>
          </Text>
        </View>
      );

    case 'friends':
      return (
        <View style={styles.staticChip} accessibilityLabel={t`Friends`}>
          <Text style={[styles.staticChipText, { fontFamily: chipFont }]}>
            <Trans>Friends</Trans>
          </Text>
        </View>
      );

    case 'self':
      return null;
  }
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
    pending: { opacity: PENDING_OPACITY },
    primaryPillText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    staticChip: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    staticChipText: {
      fontSize: typeRoles.label.size,
      color: colors.textMuted,
    },
  });
}
