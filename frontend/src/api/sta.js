import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const EP = {
  summary: (id) => `/api/sta/summary/${id}`,
  versions: (id) => `/api/sta/versions/${id}`,
  // Also keep RTM endpoints we need to invalidate
  rtmProjects: '/api/rtm/projects',
  rtmOverview: (id) => `/api/rtm/overview/${id}`,
};

// ── STA Summary ──────────────────────────────────────────────────

export function useStaSummary(projectId) {
  const key = projectId ? EP.summary(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    staSummary: data ?? null,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── STA Version Matrix ───────────────────────────────────────────

export function useStaVersions(projectId, { search, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.versions(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000
  });
  return useMemo(() => ({
    items: data?.items ?? [],
    total: data?.total ?? 0,
    versions: data?.versions ?? [],
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Mutations ────────────────────────────────────────────────────

export async function importStaFile(projectId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosServices.post(`/api/sta/import/${projectId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  mutate(EP.rtmProjects);
  mutate(EP.summary(projectId));
  mutate(EP.rtmOverview(projectId));
  return res.data;
}

export async function importBundledSta(projectId) {
  const res = await axiosServices.post(`/api/sta/import-bundled/${projectId}`);
  mutate(EP.rtmProjects);
  mutate(EP.summary(projectId));
  mutate(EP.rtmOverview(projectId));
  return res.data;
}
