import { requireAuth, getAuthenticatedUser } from "@/lib/auth-guard";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  // Ensure the user is authenticated (server-side redirect if not)
  await requireAuth();

  // Fetch authenticated user data + profile
  const authData = await getAuthenticatedUser();

  if (!authData) {
    return null; // Fallback if no session
  }

  // Pass the data to a client component for rendering
  return <ProfileClient initialAuthData={authData} />;
}
