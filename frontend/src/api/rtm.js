import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const EP = {
  projects: '/api/rtm/projects',
  overview: (id) => `/api/rtm/overview/${id}`,
  modules: (id) => `/api/rtm/modules/${id}`,
  heatmap: (id) => `/api/rtm/heatmap/${id}`,
  features: (id) => `/api/rtm/features/${id}`,
  requirements: '/api/rtm/requirements',
  requirementDetail: (id) => `/api/rtm/requirements/${id}`,
  gaps: (id) => `/api/rtm/gaps/${id}`,
  featureLandscape: (id) => `/api/rtm/feature-landscape/${id}`,
  featureDetail: (id) => `/api/rtm/feature-detail/${id}`,
  featureGaps: (id) => `/api/rtm/feature-gaps/${id}`,
  featureEvidence: (id) => `/api/rtm/feature-evidence/${id}`,
  qaMetrics: (id) => `/api/rtm/qa-metrics/${id}`,
  snapshots: (id) => `/api/rtm/snapshots/${id}`,
  exportJson: (id) => `/api/rtm/export/${id}?format=json`,
  exportCsv: (id) => `/api/rtm/export/${id}?format=csv`,
};

// ── Projects ──────────────────────────────────────────────────────

export function useRtmProjects() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.projects, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    projects: data ?? [],
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Overview ──────────────────────────────────────────────────────

export function useRtmOverview(projectId) {
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

// ── Modules ───────────────────────────────────────────────────────

export function useRtmModules(projectId) {
  const key = projectId ? EP.modules(projectId) : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    modules: data ?? [],
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Heatmap ───────────────────────────────────────────────────────

export function useRtmHeatmap(projectId, topN = 15) {
  const key = projectId ? `${EP.heatmap(projectId)}?top_n=${topN}` : null;
  const { data, isLoading, error } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    heatmap: data ?? { features: [], modules: [], cells: {} },
    loading: isLoading,
    error
  }), [data, isLoading, error]);
}

// ── Requirements ──────────────────────────────────────────────────

export function useRtmRequirements(projectId, { feature, module, traceStatus, search, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (projectId) params.set('project_id', projectId);
  if (feature) params.set('feature', feature);
  if (module) params.set('module', module);
  if (traceStatus) params.set('trace_status', traceStatus);
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.requirements}?${params.toString()}` : null;
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

// ── Requirement Detail ────────────────────────────────────────────

export function useRtmRequirementDetail(requirementId) {
  const key = requirementId ? EP.requirementDetail(requirementId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    detail: data ?? null,
    loading: isLoading,
    error
  }), [data, isLoading, error]);
}

// ── Gaps ──────────────────────────────────────────────────────────

export function useRtmGaps(projectId, { gapType, priority, module, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (gapType) params.set('gap_type', gapType);
  if (priority) params.set('priority', priority);
  if (module) params.set('module', module);
  params.set('limit', limit);
  params.set('offset', offset);

  const key = projectId ? `${EP.gaps(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error, mutate: refresh } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error,
    refresh
  }), [data, isLoading, error, refresh]);
}

// ── Snapshots ─────────────────────────────────────────────────────

export function useRtmSnapshots(projectId) {
  const key = projectId ? EP.snapshots(projectId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, {
    revalidateOnFocus: false
  });
  return useMemo(() => ({
    snapshots: data ?? [],
    loading: isLoading,
    error
  }), [data, isLoading, error]);
}

// ── Feature Aggregations ──────────────────────────────────────────

export function useFeatureLandscape(projectId) {
  const key = projectId ? EP.featureLandscape(projectId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({
    landscape: data ?? null, loading: isLoading, error
  }), [data, isLoading, error]);
}

export function useFeatureDetail(projectId, feature) {
  const params = new URLSearchParams();
  if (feature) params.set('feature', feature);
  const key = projectId && feature ? `${EP.featureDetail(projectId)}?${params.toString()}` : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({
    detail: data ?? null, loading: isLoading, error
  }), [data, isLoading, error]);
}

export function useFeatureGaps(projectId) {
  const key = projectId ? EP.featureGaps(projectId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({
    gapData: data ?? null, loading: isLoading, error
  }), [data, isLoading, error]);
}

export function useFeatureEvidence(projectId) {
  const key = projectId ? EP.featureEvidence(projectId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({
    evidenceData: data ?? null, loading: isLoading, error
  }), [data, isLoading, error]);
}

// ── QA Metrics ────────────────────────────────────────────────────

export function useQaMetrics(projectId) {
  const key = projectId ? EP.qaMetrics(projectId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({
    metrics: data ?? null, loading: isLoading, error
  }), [data, isLoading, error]);
}

// ── Mutations ─────────────────────────────────────────────────────

export async function importBundledRtm({ projectName, projectVersion } = {}) {
  const params = new URLSearchParams();
  if (projectName) params.set('project_name', projectName);
  if (projectVersion) params.set('project_version', projectVersion);
  const res = await axiosServices.post(`/api/rtm/import-bundled?${params.toString()}`);
  mutate(EP.projects);
  return res.data;
}

export async function importRtmFile(file, { sheetName, projectName, projectVersion } = {}) {
  const form = new FormData();
  form.append('file', file);
  const params = new URLSearchParams();
  if (sheetName) params.set('sheet_name', sheetName);
  if (projectName) params.set('project_name', projectName);
  if (projectVersion) params.set('project_version', projectVersion);

  const res = await axiosServices.post(`/api/rtm/import?${params.toString()}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  mutate(EP.projects);
  return res.data;
}

export async function deleteRtmProject(projectId) {
  const res = await axiosServices.delete(`/api/rtm/projects/${projectId}`);
  mutate(EP.projects);
  return res.data;
}

export async function updateRtmGap(gapId, { assignedTo, notes, resolved } = {}) {
  const params = new URLSearchParams();
  if (assignedTo !== undefined) params.set('assigned_to', assignedTo);
  if (notes !== undefined) params.set('notes', notes);
  if (resolved) params.set('resolved', 'true');
  const res = await axiosServices.patch(`/api/rtm/gaps/item/${gapId}?${params.toString()}`);
  return res.data;
}

export async function refreshGapAnalysis(projectId) {
  const res = await axiosServices.post(`/api/rtm/gaps/${projectId}/refresh`);
  return res.data;
}

export async function takeRtmSnapshot(projectId) {
  const res = await axiosServices.post(EP.snapshots(projectId));
  return res.data;
}
