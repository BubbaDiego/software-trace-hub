import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

const EP = {
  summary: '/api/swdd/summary',
  overview: '/api/swdd/overview',
  items: '/api/swdd/items',
  itemDetail: (id) => `/api/swdd/items/${id}`,
  units: '/api/swdd/units',
  architecture: '/api/swdd/architecture',
  crossRefs: '/api/swdd/cross-references',
};

export function useSwddSummary() {
  const { data, isLoading, error, mutate: refresh } = useSWR(EP.summary, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ summary: data ?? null, loading: isLoading, error, refresh }), [data, isLoading, error, refresh]);
}

export function useSwddOverview() {
  const { data, isLoading, error } = useSWR(EP.overview, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ overview: data ?? null, loading: isLoading, error }), [data, isLoading, error]);
}

export function useSwddItems({ sectionType, search, limit = 200, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (sectionType) params.set('section_type', sectionType);
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);
  const key = `${EP.items}?${params.toString()}`;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ items: data?.items ?? [], total: data?.total ?? 0, loading: isLoading, error }), [data, isLoading, error]);
}

export function useSwddItemDetail(itemId) {
  const key = itemId ? EP.itemDetail(itemId) : null;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ detail: data ?? null, loading: isLoading, error }), [data, isLoading, error]);
}

export function useSwddUnits({ search, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', limit);
  params.set('offset', offset);
  const key = `${EP.units}?${params.toString()}`;
  const { data, isLoading, error } = useSWR(key, fetcher, { revalidateOnFocus: false, dedupingInterval: 2000 });
  return useMemo(() => ({ units: data?.items ?? [], total: data?.total ?? 0, loading: isLoading, error }), [data, isLoading, error]);
}

export function useSwddArchitecture() {
  const { data, isLoading, error } = useSWR(EP.architecture, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ archData: data ?? null, loading: isLoading, error }), [data, isLoading, error]);
}

export function useSwddCrossRefs() {
  const { data, isLoading, error } = useSWR(EP.crossRefs, fetcher, { revalidateOnFocus: false });
  return useMemo(() => ({ xrefData: data ?? null, loading: isLoading, error }), [data, isLoading, error]);
}

export async function importSwddFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await axiosServices.post('/api/swdd/import', fd);
  mutate(EP.summary);
  mutate(EP.overview);
  mutate(EP.architecture);
  mutate(EP.crossRefs);
  return res.data;
}

export async function importBundledSwdd() {
  const res = await axiosServices.post('/api/swdd/import-bundled');
  mutate(EP.summary);
  mutate(EP.overview);
  mutate(EP.architecture);
  mutate(EP.crossRefs);
  return res.data;
}
