export const META_PIXEL_ID = "1595122382217844";

export type MetaEventParameters = Record<string, string | number | string[]>;
export type MetaBrowserIdentifiers = { fbp?: string; fbc?: string };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)).slice(0, 255) : undefined;
}

export function getMetaBrowserIdentifiers(): MetaBrowserIdentifiers {
  return {
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
  };
}

export function trackMetaEvent(
  eventName: string,
  parameters?: MetaEventParameters,
  eventId?: string,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) {
    window.fbq("track", eventName, parameters, { eventID: eventId });
    return;
  }
  window.fbq("track", eventName, parameters);
}
