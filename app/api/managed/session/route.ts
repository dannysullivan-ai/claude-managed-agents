import { createManagedRoutes } from "@/lib/managed/routes";

export const runtime = "nodejs";
export const maxDuration = 60;
export const { GET, POST, DELETE } = createManagedRoutes("solution");
