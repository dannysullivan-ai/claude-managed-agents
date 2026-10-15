import type { Metadata } from "next";
import { ManagedConcierge } from "@/components/managed-concierge";
import "./agent.css";

export const metadata: Metadata = { title: "Offsite — Completed demo" };

export default async function AgentPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  return <ManagedConcierge key="solution" implementation="solution" embedded={query.embed === "1"} hosted={process.env.VERCEL === "1"} />;
}
