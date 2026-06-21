'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { DashboardStats } from '../types/scan';

export function useDashboardStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient.get<DashboardStats>('/api/users/me/stats')
      .then(stats => {
        if (mounted) {
          setData(stats);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { data, isLoading, error };
}
