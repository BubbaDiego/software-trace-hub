import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
const EP = {
  overview: (pid) => `/api/rtm/iec62304/overview/${pid}`,
  clauses: (pid) => `/api/rtm/iec62304/clauses/${pid}`,
  gaps: (pid) => `/api/rtm/iec62304/gaps/${pid}`,
  safety: (pid) => `/api/rtm/iec62304/safety/${pid}`
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------
export function useIec62304Overview(projectId) {
  const key = projectId ? EP.overview(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ overview: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIec62304Clauses(projectId) {
  const key = projectId ? EP.clauses(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ clauses: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIec62304Gaps(projectId) {
  const key = projectId ? EP.gaps(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ gaps: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIec62304Safety(projectId) {
  const key = projectId ? EP.safety(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ safety: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}
