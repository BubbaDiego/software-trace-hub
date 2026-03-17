import useSWR from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
const EP = {
  overview: (pid) => `/api/rtm/iso14971/overview/${pid}`,
  matrix: (pid) => `/api/rtm/iso14971/matrix/${pid}`,
  clauses: (pid) => `/api/rtm/iso14971/clauses/${pid}`,
  controls: (pid) => `/api/rtm/iso14971/controls/${pid}`,
  hazards: (pid) => `/api/rtm/iso14971/hazards/${pid}`
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------
export function useIso14971Overview(projectId) {
  const key = projectId ? EP.overview(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ overview: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIso14971Matrix(projectId) {
  const key = projectId ? EP.matrix(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ matrix: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIso14971Clauses(projectId) {
  const key = projectId ? EP.clauses(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ clauses: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIso14971Controls(projectId) {
  const key = projectId ? EP.controls(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ controls: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useIso14971Hazards(projectId) {
  const key = projectId ? EP.hazards(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ hazards: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}
