import { useState, useEffect, useCallback } from 'react';

const AVATAR_EVENT = 'eaios-avatar-updated';

export const useAvatar = (userId?: string) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const readAvatar = useCallback(() => {
    if (!userId) {
      setAvatarUrl(null);
      return;
    }
    const stored = localStorage.getItem(`avatar_${userId}`);
    setAvatarUrl(stored);
  }, [userId]);

  useEffect(() => {
    readAvatar();
  }, [readAvatar, version]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ userId: string }>;
      if (custom.detail?.userId === userId) {
        readAvatar();
      }
    };
    window.addEventListener(AVATAR_EVENT, handler);
    return () => window.removeEventListener(AVATAR_EVENT, handler);
  }, [userId, readAvatar]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === `avatar_${userId}`) {
        readAvatar();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId, readAvatar]);

  const refreshAvatar = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  return { avatarUrl, refreshAvatar };
};

export const notifyAvatarUpdated = (userId: string) => {
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: { userId } }));
};
