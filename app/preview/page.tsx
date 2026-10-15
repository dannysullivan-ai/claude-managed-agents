import type { Metadata } from "next";
import { Concierge } from "@/components/concierge";

export const metadata: Metadata = { title: "Offsite — Scripted UI preview" };

export default async function Preview({ searchParams }: { searchParams: Promise<{ embed?: string }> }) {
  const params = await searchParams;
  return <Concierge embedded={params.embed === "1"} />;
}
