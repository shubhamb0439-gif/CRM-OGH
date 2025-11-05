import { useEffect } from 'react';
import { realtimeManager } from '../lib/realtimeManager';

/**
 * Hook for managing realtime subscriptions with automatic cleanup
 */
export function useRealtimeSubscription(
  channelName: string,
  table: string,
  callback: (payload: any) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = realtimeManager.subscribe(
      channelName,
      table,
      callback
    );

    return unsubscribe;
  }, [channelName, table, enabled]);
}
