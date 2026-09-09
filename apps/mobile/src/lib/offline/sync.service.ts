import { connectivityService, ConnectionStatus } from './connectivity.service';

export type OfflineAction =
  | { type: 'FETCH_STUDENTS'; payload?: unknown }
  | { type: 'FETCH_TEACHERS'; payload?: unknown }
  | { type: 'FETCH_CLASSES'; payload?: unknown }
  | { type: 'FETCH_ATTENDANCE'; payload?: unknown }
  | { type: 'FETCH_MARKS'; payload?: unknown }
  | { type: 'FETCH_HOMEWORK'; payload?: unknown }
  | { type: 'FETCH_NOTIFICATIONS'; payload?: unknown };

export class SyncQueueService {
  private queue: OfflineAction[] = [];
  private processing = false;

  enqueue(action: OfflineAction) {
    this.queue.push(action);
  }

  async processQueue() {
    if (this.processing || !connectivityService.isOnline()) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (!action) break;
      try {
        await this.execute(action);
      } catch {
        this.queue.unshift(action);
        break;
      }
    }

    this.processing = false;
  }

  private async execute(action: OfflineAction): Promise<void> {
    // Placeholder for actual sync logic
    // Real implementation would dispatch mutations to the server
    // and update local cache with the response.
  }

  getPendingCount(): number {
    return this.queue.length;
  }
}

export const syncQueue = new SyncQueueService();
