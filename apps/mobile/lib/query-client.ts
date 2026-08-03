import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared QueryClient instance, default options only.
 *
 * SC-4: no persistence wrapper this phase — there is no cacheable content yet
 * (the shell is online-assumed). Mounting `QueryClientProvider` directly (not a
 * custom wrapper) keeps adding `persistQueryClient` later a config change, not
 * a rewrite, once the timetable/map phases land cacheable content.
 */
export const queryClient = new QueryClient();
