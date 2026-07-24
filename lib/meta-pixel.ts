export const META_PIXEL_ID = "1595122382217844";

export type MetaEventParameters = Record<string, string | number | string[]>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(eventName: string, parameters?: MetaEventParameters) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, parameters);
}
