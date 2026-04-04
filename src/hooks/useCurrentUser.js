import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const useCurrentUser = () => {
  const { data } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.ME, { _skipErrorHandling: true });
        return response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return { email: data?.email ?? null };
};
