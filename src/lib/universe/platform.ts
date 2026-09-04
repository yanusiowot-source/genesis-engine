export type HostKind = "windows" | "macos" | "linux" | "ios" | "android" | "other";

export type PlatformInfo = {
  kind: HostKind;
  electron: boolean;
  capacitor: boolean;
  standalone: boolean;
  native: boolean;
};

declare global {
  interface Window {
    genesisDesktop?: { platform: string };
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

export function detectPlatform(): PlatformInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      kind: "other",
      electron: false,
      capacitor: false,
      standalone: false,
      native: false,
    };
  }

  const ua = navigator.userAgent;
  const electron = Boolean(window.genesisDesktop) || /Electron/i.test(ua);
  const capacitor = Boolean(window.Capacitor?.isNativePlatform?.());
  const standalone =
    electron ||
    capacitor ||
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  let kind: HostKind = "other";
  const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/i.test(ua) || touchMac) kind = "ios";
  else if (/android/i.test(ua)) kind = "android";
  else if (/Win/i.test(navigator.platform) || /Windows NT/i.test(ua)) kind = "windows";
  else if (/Mac/i.test(navigator.platform) || /Mac OS X/i.test(ua)) kind = "macos";
  else if (/Linux/i.test(ua) || /Linux/i.test(navigator.platform)) kind = "linux";

  if (electron && window.genesisDesktop?.platform === "win32") kind = "windows";
  if (electron && window.genesisDesktop?.platform === "linux") kind = "linux";
  if (electron && window.genesisDesktop?.platform === "darwin") kind = "macos";

  return {
    kind,
    electron,
    capacitor,
    standalone,
    native: electron || capacitor,
  };
}
