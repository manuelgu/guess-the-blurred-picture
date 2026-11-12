// localStorage wrapper that never throws (private mode, blocked storage, …).
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`bb:${key}`);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`bb:${key}`, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(`bb:${key}`);
    } catch {
      /* ignore */
    }
  },
};

export interface SavedDeck {
  id: string;
  key: string;
  title: string;
  count: number;
}

export const savedDecks = {
  list(): SavedDeck[] {
    return storage.get<SavedDeck[]>("decks") ?? [];
  },
  upsert(d: SavedDeck) {
    const list = savedDecks.list().filter((x) => x.id !== d.id);
    storage.set("decks", [d, ...list]);
  },
  remove(id: string) {
    storage.set("decks", savedDecks.list().filter((x) => x.id !== id));
  },
  key(id: string): string | null {
    return savedDecks.list().find((x) => x.id === id)?.key ?? null;
  },
};
