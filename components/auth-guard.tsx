"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
