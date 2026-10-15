import type { Metadata } from "next";
import { ManagedConcierge } from "@/components/managed-concierge";
import "../agent/agent.css";

export const metadata: Metadata = { title: "Offsite — Lab starter" };

export default async function LabPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  return <ManagedConcierge key="learner" implementation="learner" embedded={query.embed === "1"} hosted={process.env.VERCEL === "1"} />;
}
