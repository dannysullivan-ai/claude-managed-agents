export type WorkshopSettings = { repository: string; folder: string };
export const SETTINGS_KEY = "offsite-workshop-settings-v1";
export const LAB_REPOSITORY = "https://github.com/dannysullivan-ai/claude-managed-agents";

export function normalizeFolder(value: string): string | null {
  const folder = value.trim().replaceAll("\\", "/").replace(/\/+$/, "");
  if (!folder || /[\r\n\0]/.test(folder) || folder.split("/").includes("..")) return null;
  return folder.startsWith("/") || /^[A-Za-z]:\//.test(folder) ? folder : null;
}

export function editorUrl(folder: string, file: string, line = 1): string | null {
  const root = normalizeFolder(folder);
  if (!root || !file || file.startsWith("/") || file.split("/").some(part => part === "..") || /[\r\n\0\\:]/.test(file)) return null;
  const path = `${root}/${file}`.replace(/^\//, "").split("/").map(part => /^[A-Za-z]:$/.test(part) ? part : encodeURIComponent(part)).join("/");
  return `vscode://file/${path}:${Math.max(1, Math.floor(line) || 1)}:1`;
}

export function validRepository(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash && url.pathname.split("/").filter(Boolean).length >= 2;
  } catch { return false; }
}

export function fillSetupCode(value: string, repository: string): { value: string; ready: boolean } {
  if (!value.includes("{{REPO_URL}}")) return { value, ready: true };
  if (!validRepository(repository)) return { value: "# Set the repository URL using Setup above.\n# The clone command will appear here once it is configured.\n\n" + value.replace(/^.*\{\{REPO_URL\}\}.*$/m, "# git clone command pending the lab repository URL"), ready: false };
  const quoted = `'${repository.trim().replaceAll("'", "'\\''")}'`;
  return { value: value.replaceAll("{{REPO_URL}}", quoted), ready: true };
}
