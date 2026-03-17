import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from 'utils/axios';

// ── FMEA API hooks ───────────────────────────────────────────────

export function useFmeaOverview() {
  const { data, isLoading, error, mutate } = useSWR('/api/rtm/fmea/overview', fetcher, {
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
  const key = `/api/rtm/fmea/records?${params.toString()}`;

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
  const { data, isLoading, error, mutate } = useSWR('/api/rtm/fmea/common-causes', fetcher, {
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
  const { data, isLoading, error, mutate } = useSWR('/api/rtm/fmea/product-matrix', fetcher, {
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
