import type { Metadata } from "next";
import { Workshop } from "@/components/workshop";
import { getWorkshopSlides } from "@/lib/workshop-code";
import "./workshop.css";

export const metadata: Metadata = {
  title: "Claude Managed Agents — Technical session and lab",
  description: "A 20-minute teaching session and 60-minute developer lab, inside the app you build.",
};

export default async function WorkshopPage() {
  return <Workshop slides={await getWorkshopSlides()} />;
}
