import NetInfo from '@react-native-community/netinfo';

export type ConnectionStatus = 'online' | 'offline' | 'unknown';

export class ConnectivityService {
  private status: ConnectionStatus = 'unknown';
  private listeners: Array<(status: ConnectionStatus) => void> = [];

  async init() {
    const state = await NetInfo.fetch();
    this.status = state.isConnected && state.isInternetReachable ? 'online' : 'offline';

    NetInfo.addEventListener((state) => {
      const newStatus = state.isConnected && state.isInternetReachable ? 'online' : 'offline';
      if (newStatus !== this.status) {
        this.status = newStatus;
        this.listeners.forEach((l) => l(newStatus));
      }
    });
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  subscribe(listener: (status: ConnectionStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const connectivityService = new ConnectivityService();
