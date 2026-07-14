import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchCurrentUser, logout } from "@/lib/authApi";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export function useAuth() {
  const query = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: Boolean(query.data),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    try {
      await logout();
    } catch {
      // Clear local session even if the API call fails.
    }
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
    navigate("/login", { replace: true });
  };
}
