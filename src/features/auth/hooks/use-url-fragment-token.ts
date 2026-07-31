'use client';

import { useEffect, useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

export function useUrlFragmentToken(legacyToken?: string) {
  const token = useSyncExternalStore(
    subscribe,
    () => {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      return fragment.get('token') ?? legacyToken;
    },
    () => legacyToken,
  );
  const resolved = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const sanitizedUrl = new URL(window.location.href);
    sanitizedUrl.hash = '';
    sanitizedUrl.searchParams.delete('token');
    window.history.replaceState(null, '', `${sanitizedUrl.pathname}${sanitizedUrl.search}`);
  }, []);

  return { token, resolved };
}
