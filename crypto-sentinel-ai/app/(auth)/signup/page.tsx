import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Create account — Crypto Sentinel AI" };

export default function SignupPage() {
  return <AuthShell mode="signup" />;
}
