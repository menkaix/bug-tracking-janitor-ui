import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api.service';
import { API_ENDPOINTS } from '../config/api.config';

export const useCurrentUser = () => {
  const { data } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ME);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { email: data?.email ?? null };
};
