import { useEffect } from 'react';

/**
 * Hook for listening to realtime changes via custom events
 * The realtime manager automatically handles all subscriptions globally
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

    // Map table names to event names
    const eventName = `supabase:${table}:change`;

    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    console.log(`[useRealtimeSubscription] Listening to ${eventName}`);
    window.addEventListener(eventName, handleEvent);

    return () => {
      console.log(`[useRealtimeSubscription] Removing listener for ${eventName}`);
      window.removeEventListener(eventName, handleEvent);
    };
  }, [table, enabled]);
}
