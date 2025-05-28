import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<UserType | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
