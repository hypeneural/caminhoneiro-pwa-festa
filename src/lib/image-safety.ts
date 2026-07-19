const blockedImageHosts = ["via.placeholder.com"];

export function isSafeImageSrc(value?: string | null): value is string {
  if (!value) return false;
  return !blockedImageHosts.some((host) => value.includes(host));
}

export function selectSafeImageSrc(primary?: string | null, fallback?: string | null): string | null {
  if (isSafeImageSrc(primary)) return primary;
  if (isSafeImageSrc(fallback)) return fallback;
  return null;
}
