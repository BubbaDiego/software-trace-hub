import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
const EP = {
  summary: '/api/resources/summary',
  overview: '/api/resources/overview',
  projects: '/api/resources/projects',
  people: '/api/resources/people',
  timeline: '/api/resources/timeline',
  teams: '/api/resources/teams',
};

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

export function useResourceSummary() {
  const { data, isLoading, error, mutate: refresh } = useSWR(
    EP.summary,
    fetcher,
    { revalidateOnFocus: false }
  );
  return useMemo(() => ({
    resourceSummary: data || {},
    resourceLoading: isLoading,
    resourceError: error,
    refreshResources: refresh,
  }), [data, error, isLoading, refresh]);
}

export function useResourceOverview() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.overview, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ overview: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useResourceProjects() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.projects, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ projects: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useResourcePeople() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.people, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ people: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useResourceTimeline() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.timeline, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ timeline: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useResourceTeams() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.teams, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ teams: data ?? [], loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function importResourceFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await axiosServices.post('/api/resources/import', fd);
  mutate(EP.summary);
  return res.data;
}
