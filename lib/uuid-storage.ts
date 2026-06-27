const KEY = "econmind_uuid";

export function getStoredUuid(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setStoredUuid(uuid: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, uuid);
}
