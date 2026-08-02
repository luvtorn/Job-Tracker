export type SessionBrowser = 'EDGE' | 'CHROME' | 'FIREFOX' | 'SAFARI' | 'UNKNOWN';
export type SessionPlatform = 'WINDOWS' | 'MACOS' | 'IOS' | 'ANDROID' | 'LINUX' | 'UNKNOWN';
export type SessionDeviceType = 'DESKTOP' | 'MOBILE';

export type SessionDevice = {
  browser: SessionBrowser;
  platform: SessionPlatform;
  deviceType: SessionDeviceType;
};

export function describeSessionDevice(userAgent: string | null): SessionDevice {
  if (!userAgent) {
    return { browser: 'UNKNOWN', platform: 'UNKNOWN', deviceType: 'DESKTOP' };
  }

  const browser: SessionBrowser = /Edg\//.test(userAgent)
    ? 'EDGE'
    : /(?:Chrome|CriOS)\//.test(userAgent)
      ? 'CHROME'
      : /(?:Firefox|FxiOS)\//.test(userAgent)
        ? 'FIREFOX'
        : /Safari\//.test(userAgent)
          ? 'SAFARI'
          : 'UNKNOWN';

  const platform: SessionPlatform = /Android/.test(userAgent)
    ? 'ANDROID'
    : /(?:iPhone|iPad|iPod)/.test(userAgent)
      ? 'IOS'
      : /Windows/.test(userAgent)
        ? 'WINDOWS'
        : /Macintosh|Mac OS X/.test(userAgent)
          ? 'MACOS'
          : /Linux/.test(userAgent)
            ? 'LINUX'
            : 'UNKNOWN';

  return {
    browser,
    platform,
    deviceType: /(?:Mobile|Android|iPhone|iPad|iPod)/.test(userAgent) ? 'MOBILE' : 'DESKTOP',
  };
}
