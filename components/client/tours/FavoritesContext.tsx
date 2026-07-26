/**
 * FavoritesContext.tsx
 * Shared favorited-tour-IDs store for the client area — backed by the real
 * favorites table (client_favorites_list / favorite_toggle), shared between
 * the Tours tab (heart toggle) and the Dashboard's "My Favorites" section.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CLIENT_FAVORITES_LIST_API_URL, FAVORITE_TOGGLE_API_URL } from '@/constants/api';
import { useAuth } from '@/components/auth/AuthContext';

type FavoritesContextValue = {
  favoriteIds: Set<string>;
  isFavorited: (tourId: string) => boolean;
  toggleFavorite: (tourId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    if (!user) { setFavoriteIds(new Set()); return; }
    fetch(`${CLIENT_FAVORITES_LIST_API_URL}&userId=${user.id}`)
      .then((res) => res.json())
      .then((result) => { if (result.status === 'success') setFavoriteIds(new Set(result.data)); })
      .catch(() => {});
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFavorite = async (tourId: string) => {
    if (!user) return;
    const wasFavorited = favoriteIds.has(tourId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(tourId); else next.add(tourId);
      return next;
    });
    try {
      const res = await fetch(FAVORITE_TOGGLE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, tourId }),
      });
      const result = await res.json();
      if (result.status !== 'success') throw new Error();
    } catch {
      // Revert the optimistic update if the server call failed.
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(tourId); else next.delete(tourId);
        return next;
      });
    }
  };

  const value = useMemo(
    () => ({ favoriteIds, isFavorited: (id: string) => favoriteIds.has(id), toggleFavorite }),
    [favoriteIds]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
