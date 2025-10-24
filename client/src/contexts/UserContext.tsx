import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => 
    localStorage.getItem("userId")
  );

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  useEffect(() => {
    async function initUser() {
      if (!userId) {
        const demoEmail = "demo@whatsappai.com";
        
        try {
          const res = await fetch(`/api/users/email/${demoEmail}`);
          if (res.ok) {
            const existingUser = await res.json() as User;
            localStorage.setItem("userId", existingUser.id);
            setUserId(existingUser.id);
          } else {
            throw new Error("User not found");
          }
        } catch {
          const res = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: demoEmail,
              name: "Demo User",
            }),
          });
          const newUser = await res.json() as User;
          localStorage.setItem("userId", newUser.id);
          setUserId(newUser.id);
        }
      }
    }
    
    initUser();
  }, [userId]);

  return (
    <UserContext.Provider value={{ user: user || null, isLoading }}>
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
