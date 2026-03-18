import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const EP = {
  summary: (id) => `/api/sta/summary/${id}`,
  overview: (id) => `/api/sta/overview/${id}`,
  specs: (id) => `/api/sta/specs/${id}`,
  designOutputs: (id) => `/api/sta/design-outputs/${id}`,
  unitTests: (id) => `/api/sta/unit-tests/${id}`,
  versionCoverage: (id) => `/api/sta/version-coverage/${id}`,
  versions: (id) => `/api/sta/versions/${id}`,
  rtmProjects: '/api/rtm/projects',
  rtmOverview: (id) => `/api/rtm/overview/${id}`,
};

// ── Summary ──────────────────────────────────────────────────────

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

// ── Overview (KPIs, charts) ──────────────────────────────────────

export function useStaOverview(projectId) {
  const key = projectId ? EP.overview(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    overview: data ?? null,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Spec Reference Matrix ────────────────────────────────────────

export function useStaSpecs(projectId, { module, search, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (module) params.set('module', module);
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.specs(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000
  });
  return useMemo(() => ({
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Design Outputs ───────────────────────────────────────────────

export function useStaDesignOutputs(projectId, { limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.designOutputs(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    designData: data ?? null,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Unit Tests ───────────────────────────────────────────────────

export function useStaUnitTests(projectId, { search, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.unitTests(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000
  });
  return useMemo(() => ({
    utData: data ?? null,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Version Coverage ─────────────────────────────────────────────

export function useStaVersionCoverage(projectId) {
  const key = projectId ? EP.versionCoverage(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    versionData: data ?? null,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Version Matrix ───────────────────────────────────────────────

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
