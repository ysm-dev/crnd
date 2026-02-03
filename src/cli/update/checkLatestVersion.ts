const NPM_REGISTRY_URL = "https://registry.npmjs.org/crnd";
const FETCH_TIMEOUT_MS = 5000;

export default async function checkLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(NPM_REGISTRY_URL, {
      headers: { Accept: "application/vnd.npm.install-v1+json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      "dist-tags"?: { latest?: string };
    };
    return data["dist-tags"]?.latest ?? null;
  } catch {
    // Network error, timeout, or parse error - silently fail
    return null;
  }
}
