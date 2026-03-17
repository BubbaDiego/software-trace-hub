import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import { fetcher } from 'utils/axios';
import axiosServices from 'utils/axios';

// ── FMEA API hooks ───────────────────────────────────────────────

const EP = {
  summary: '/api/fmea/summary',
  overview: '/api/fmea/overview',
  records: '/api/fmea/records',
  commonCauses: '/api/fmea/common-causes',
  productMatrix: '/api/fmea/product-matrix',
};

export function useFmeaSummary() {
  const { data, isLoading, error, mutate: refresh } = useSWR(
    EP.summary,
    fetcher,
    { revalidateOnFocus: false }
  );
  return useMemo(() => ({
    fmeaSummary: data || {},
    fmeaLoading: isLoading,
    fmeaError: error,
    refreshFmea: refresh,
  }), [data, error, isLoading, refresh]);
}

export function useFmeaOverview() {
  const { data, isLoading, error, mutate } = useSWR(EP.overview, fetcher, {
    revalidateOnFocus: false,
  });
  return useMemo(() => ({
    overview: data || {},
    overviewLoading: isLoading,
    overviewError: error,
    refreshOverview: mutate,
  }), [data, error, isLoading, mutate]);
}

export function useFmeaRecords(product, search, limit = 100, offset = 0) {
  const params = new URLSearchParams();
  if (product) params.set('product', product);
  if (search) params.set('search', search);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  const key = `${EP.records}?${params.toString()}`;

  const { data, isLoading, error, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });
  return useMemo(() => ({
    records: data?.items || [],
    total: data?.total || 0,
    recordsLoading: isLoading,
    recordsError: error,
    refreshRecords: mutate,
  }), [data, error, isLoading, mutate]);
}

export function useFmeaCommonCauses() {
  const { data, isLoading, error, mutate } = useSWR(EP.commonCauses, fetcher, {
    revalidateOnFocus: false,
  });
  return useMemo(() => ({
    commonCauses: data || [],
    ccLoading: isLoading,
    ccError: error,
    refreshCC: mutate,
  }), [data, error, isLoading, mutate]);
}

export function useFmeaProductMatrix() {
  const { data, isLoading, error, mutate } = useSWR(EP.productMatrix, fetcher, {
    revalidateOnFocus: false,
  });
  return useMemo(() => ({
    matrix: data?.matrix || [],
    products: data?.products || [],
    matrixLoading: isLoading,
    matrixError: error,
    refreshMatrix: mutate,
  }), [data, error, isLoading, mutate]);
}

// ── Mutations ────────────────────────────────────────────────────

export async function importFmeaFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await axiosServices.post('/api/fmea/import', fd);
  mutate(EP.summary);
  mutate(EP.overview);
  return res.data;
}
