import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectivityService } from './connectivity.service';

export interface CachedEntity<T> {
  data: T;
  cachedAt: number;
  staleAt: number;
  synced: boolean;
}

export class OfflineStorageService {
  private readonly PREFIX = 'offline_cache_';

  async get<T>(key: string): Promise<CachedEntity<T> | null> {
    try {
      const raw = await AsyncStorage.getItem(this.PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as CachedEntity<T>;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): Promise<void> {
    const entity: CachedEntity<T> = {
      data,
      cachedAt: Date.now(),
      staleAt: Date.now() + ttlMs,
      synced: connectivityService.isOnline(),
    };
    try {
      await AsyncStorage.setItem(this.PREFIX + key, JSON.stringify(entity));
    } catch {
      // storage full or unavailable
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PREFIX + key);
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k: string) => k.startsWith(this.PREFIX));
      for (const key of cacheKeys) {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  async isStale(key: string): Promise<boolean> {
    const cached = await this.get(key);
    if (!cached) return true;
    return Date.now() > cached.staleAt;
  }

  async markSynced(key: string): Promise<void> {
    const cached = await this.get(key);
    if (cached) {
      cached.synced = true;
      try {
        await AsyncStorage.setItem(this.PREFIX + key, JSON.stringify(cached));
      } catch {
        // ignore
      }
    }
  }

  async getUnsyncedKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k: string) => k.startsWith(this.PREFIX));
      const unsynced: string[] = [];
      for (const k of cacheKeys) {
        const raw = await AsyncStorage.getItem(k);
        if (raw) {
          const entity = JSON.parse(raw) as CachedEntity<unknown>;
          if (!entity.synced) {
            unsynced.push(k.replace(this.PREFIX, ''));
          }
        }
      }
      return unsynced;
    } catch {
      return [];
    }
  }
}

export const offlineStorage = new OfflineStorageService();
