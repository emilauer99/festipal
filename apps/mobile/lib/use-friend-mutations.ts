import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FriendRequestResult, MutationResult } from '@quiks/contracts';

import { apiClient } from './api-client';
import { friendKeys, unwrapOk } from './friend-queries';

async function sendFriendRequestFn(accountId: string): Promise<FriendRequestResult> {
  const response = await apiClient.sendFriendRequest({ body: { targetAccountId: accountId } });
  return unwrapOk<FriendRequestResult>(response);
}

async function acceptFriendRequestFn(accountId: string): Promise<{ result: 'friends' }> {
  const response = await apiClient.acceptFriendRequest({ params: { accountId }, body: {} });
  return unwrapOk<{ result: 'friends' }>(response);
}

async function declineFriendRequestFn(accountId: string): Promise<MutationResult> {
  const response = await apiClient.declineFriendRequest({ params: { accountId }, body: {} });
  return unwrapOk<MutationResult>(response);
}

async function withdrawFriendRequestFn(accountId: string): Promise<MutationResult> {
  const response = await apiClient.withdrawFriendRequest({ params: { accountId }, body: {} });
  return unwrapOk<MutationResult>(response);
}

async function unfriendFn(accountId: string): Promise<MutationResult> {
  const response = await apiClient.unfriend({ params: { accountId } });
  return unwrapOk<MutationResult>(response);
}

export type UseFriendMutationsResult = {
  sendRequest: (accountId: string) => void;
  acceptRequest: (accountId: string) => void;
  declineRequest: (accountId: string) => void;
  withdrawRequest: (accountId: string) => void;
  unfriend: (accountId: string) => void;
  /** The `accountId` a mutation is currently in flight for, or `undefined`. A caller compares this to its own row's `accountId` to know whether ITS action is the one that should be disabled. */
  pendingTargetId: string | undefined;
  /** The `accountId` whose most recent mutation rejected, or `undefined` — cleared on the next attempt for that target. */
  failedTargetId: string | undefined;
};

/**
 * The ONE place every friend-mutation is DEFINED (D-04/08-CONTEXT). A second
 * definition of `apiClient.sendFriendRequest`/`acceptFriendRequest`/
 * `declineFriendRequest`/`withdrawFriendRequest`/`unfriend` anywhere else in
 * the repo is the defect this hook exists to prevent — multiple call sites
 * of THIS hook (search hit, requests section, friend detail, scan
 * confirmation card) are fine and expected.
 *
 * Every mutation invalidates `friendKeys.all` in `onSettled`, not just
 * `onSuccess`: the error path ("this person doesn't exist anymore") is
 * exactly the case that must re-read the lists, since it means the caller's
 * view of that person is already stale.
 */
export function useFriendMutations(): UseFriendMutationsResult {
  const queryClient = useQueryClient();
  const [pendingTargetId, setPendingTargetId] = useState<string | undefined>(undefined);
  const [failedTargetId, setFailedTargetId] = useState<string | undefined>(undefined);

  const shared = {
    onMutate: (accountId: string) => {
      setFailedTargetId(undefined);
      setPendingTargetId(accountId);
    },
    onError: (_error: unknown, accountId: string) => {
      setFailedTargetId(accountId);
    },
    onSettled: () => {
      setPendingTargetId(undefined);
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  };

  const sendRequestMutation = useMutation({ mutationFn: sendFriendRequestFn, ...shared });
  const acceptRequestMutation = useMutation({ mutationFn: acceptFriendRequestFn, ...shared });
  const declineRequestMutation = useMutation({ mutationFn: declineFriendRequestFn, ...shared });
  const withdrawRequestMutation = useMutation({ mutationFn: withdrawFriendRequestFn, ...shared });
  const unfriendMutation = useMutation({ mutationFn: unfriendFn, ...shared });

  return {
    sendRequest: (accountId) => sendRequestMutation.mutate(accountId),
    acceptRequest: (accountId) => acceptRequestMutation.mutate(accountId),
    declineRequest: (accountId) => declineRequestMutation.mutate(accountId),
    withdrawRequest: (accountId) => withdrawRequestMutation.mutate(accountId),
    unfriend: (accountId) => unfriendMutation.mutate(accountId),
    pendingTargetId,
    failedTargetId,
  };
}
