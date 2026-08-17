import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Activity, ActivityJoinResult, CreateActivityBody, MutationResult } from '@quiks/contracts';

import { apiClient } from './api-client';
import { ApiResponseError, activityKeys, unwrapCreated, unwrapOk } from './activity-queries';

/**
 * The stable stand-in `targetId` for the create mutation (11-04-PLAN Task 1)
 * — there is no `activityId` yet at the moment a create is fired, but the
 * shared pending/failed tracking below needs SOME identifier so the same
 * mechanism covers all four mutations uniformly. Exported so a call site can
 * compare `pendingTargetId`/`failedTargetId` against it (e.g. to disable the
 * create form's own submit button specifically).
 */
export const CREATE_ACTIVITY_TARGET_ID = 'create';

type CreateVariables = {
  targetId: typeof CREATE_ACTIVITY_TARGET_ID;
  festivalId: string;
  body: CreateActivityBody;
};
type MembershipVariables = { targetId: string; festivalId: string; activityId: string };

async function createActivityFn(variables: CreateVariables): Promise<Activity> {
  const response = await apiClient.createActivity({
    params: { festivalId: variables.festivalId },
    body: variables.body,
  });
  return unwrapCreated<Activity>(response);
}

async function joinActivityFn(variables: MembershipVariables): Promise<ActivityJoinResult> {
  const response = await apiClient.joinActivity({
    params: { festivalId: variables.festivalId, activityId: variables.activityId },
    body: {},
  });
  return unwrapOk<ActivityJoinResult>(response);
}

async function leaveActivityFn(variables: MembershipVariables): Promise<MutationResult> {
  const response = await apiClient.leaveActivity({
    params: { festivalId: variables.festivalId, activityId: variables.activityId },
    body: {},
  });
  return unwrapOk<MutationResult>(response);
}

async function dissolveActivityFn(variables: MembershipVariables): Promise<MutationResult> {
  const response = await apiClient.deleteActivity({
    params: { festivalId: variables.festivalId, activityId: variables.activityId },
  });
  return unwrapOk<MutationResult>(response);
}

export type UseActivityMutationsOptions = {
  /**
   * Fires once a mutation SUCCEEDS (never on the tap that started it, never
   * on a rejection), with the mutation's own result and the `targetId` it
   * ran against — same shape `useFriendMutations`' `onSuccess` establishes.
   * `targetId` is `CREATE_ACTIVITY_TARGET_ID` for a create success, so a
   * caller distinguishes "an activity was created" (navigate using the
   * result's own `id`) from "a membership mutation on an existing activity
   * succeeded" (no navigation, the detail screen just re-renders in place —
   * UI-SPEC § Screens & Navigation Contract).
   */
  onSuccess?: (result: Activity | ActivityJoinResult | MutationResult, targetId: string) => void;
};

export type UseActivityMutationsResult = {
  createActivity: (festivalId: string, body: CreateActivityBody) => void;
  joinActivity: (festivalId: string, activityId: string) => void;
  leaveActivity: (festivalId: string, activityId: string) => void;
  dissolveActivity: (festivalId: string, activityId: string) => void;
  /** The `targetId` a mutation is currently in flight for, or `undefined`. */
  pendingTargetId: string | undefined;
  /** The `targetId` whose most recent mutation rejected, or `undefined` — cleared on the next attempt for that target. */
  failedTargetId: string | undefined;
  /**
   * The HTTP status of `failedTargetId`'s rejection when it was an
   * {@link ApiResponseError} (e.g. `409` — full/started/no-profile) —
   * `undefined` for a transport-level failure or when there is no current
   * failure. Callers branch on this to distinguish the join-race 409 from the
   * generic "Couldn't save" copy (UI-SPEC Copywriting Contract).
   */
  failedTargetStatus: number | undefined;
};

/**
 * The ONE place every activity-mutation is DEFINED (11-04-PLAN Task 1,
 * mirrors `use-friend-mutations.ts`'s shape exactly — same domain shape,
 * different resource). A second definition of `apiClient.createActivity`/
 * `joinActivity`/`leaveActivity`/`deleteActivity` anywhere else in the repo
 * is the defect this hook exists to prevent.
 *
 * Every mutation invalidates `activityKeys.all(festivalId)` — the ONE shared
 * prefix — in `onSettled`, not just `onSuccess`: the error path is exactly
 * the case that must re-read the lists too (a 409 join-race means the list
 * the caller saw is already stale, UI-SPEC's join-race fallback copy).
 *
 * NO optimistic cache write anywhere in this file (UI-SPEC § Query Key &
 * Cache Contract) — the "feels immediate" contract is satisfied entirely by
 * `pendingTargetId` disabling/dampening the tapped control while the
 * mutation is in flight, plus the real invalidation once it settles.
 */
export function useActivityMutations(
  options: UseActivityMutationsOptions = {},
): UseActivityMutationsResult {
  const { onSuccess } = options;
  const queryClient = useQueryClient();
  const [pendingTargetId, setPendingTargetId] = useState<string | undefined>(undefined);
  const [failedTargetId, setFailedTargetId] = useState<string | undefined>(undefined);
  const [failedTargetStatus, setFailedTargetStatus] = useState<number | undefined>(undefined);

  function shared<TVariables extends { targetId: string; festivalId: string }>() {
    return {
      onMutate: (variables: TVariables) => {
        setFailedTargetId(undefined);
        setFailedTargetStatus(undefined);
        setPendingTargetId(variables.targetId);
      },
      onError: (error: unknown, variables: TVariables) => {
        setFailedTargetId(variables.targetId);
        setFailedTargetStatus(error instanceof ApiResponseError ? error.status : undefined);
      },
      onSuccess: (
        data: Activity | ActivityJoinResult | MutationResult,
        variables: TVariables,
      ) => {
        onSuccess?.(data, variables.targetId);
      },
      onSettled: (_data: unknown, _error: unknown, variables: TVariables) => {
        setPendingTargetId(undefined);
        void queryClient.invalidateQueries({ queryKey: activityKeys.all(variables.festivalId) });
      },
    };
  }

  const createMutation = useMutation({
    mutationFn: createActivityFn,
    ...shared<CreateVariables>(),
  });
  const joinMutation = useMutation({
    mutationFn: joinActivityFn,
    ...shared<MembershipVariables>(),
  });
  const leaveMutation = useMutation({
    mutationFn: leaveActivityFn,
    ...shared<MembershipVariables>(),
  });
  const dissolveMutation = useMutation({
    mutationFn: dissolveActivityFn,
    ...shared<MembershipVariables>(),
  });

  return {
    createActivity: (festivalId, body) =>
      createMutation.mutate({ targetId: CREATE_ACTIVITY_TARGET_ID, festivalId, body }),
    joinActivity: (festivalId, activityId) =>
      joinMutation.mutate({ targetId: activityId, festivalId, activityId }),
    leaveActivity: (festivalId, activityId) =>
      leaveMutation.mutate({ targetId: activityId, festivalId, activityId }),
    dissolveActivity: (festivalId, activityId) =>
      dissolveMutation.mutate({ targetId: activityId, festivalId, activityId }),
    pendingTargetId,
    failedTargetId,
    failedTargetStatus,
  };
}
