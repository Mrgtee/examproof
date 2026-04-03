import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/get-user-profile";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/auth/sign-in");
  }

  if (!profile) {
    redirect("/auth/sign-in");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}