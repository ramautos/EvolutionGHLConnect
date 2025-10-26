import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Obtener usuario actual desde sesión
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      return data.user as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", { email, password, name });
      const data = await response.json();
      return data.user as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.clear();
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
    // Esperar a que el usuario se cargue desde la sesión
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
  };

  const register = async (email: string, password: string, name: string) => {
    await registerMutation.mutateAsync({ email, password, name });
    // Esperar a que el usuario se cargue desde la sesión
    await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <UserContext.Provider value={{ user: user || null, isLoading, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
