import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Realtime Connection Manager
 * Handles persistent connections with automatic reconnection and heartbeat
 */
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isActive = true;

  constructor() {
    // Start heartbeat to keep connections alive
    this.startHeartbeat();

    // Handle visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Handle online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('[RealtimeManager] Tab visible, reconnecting channels');
      this.isActive = true;
      this.reconnectAllChannels();
    } else {
      console.log('[RealtimeManager] Tab hidden, pausing activity');
      this.isActive = false;
    }
  };

  private handleOnline = () => {
    console.log('[RealtimeManager] Network online, reconnecting');
    this.reconnectAllChannels();
  };

  private handleOffline = () => {
    console.log('[RealtimeManager] Network offline');
  };

  private startHeartbeat() {
    // Heartbeat every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isActive && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.channels.forEach((channel, name) => {
          if (channel.state !== 'joined') {
            console.log(`[RealtimeManager] Heartbeat: Channel ${name} not joined, reconnecting`);
            this.reconnectChannel(name);
          }
        });
      }
    }, 30000);
  }

  /**
   * Subscribe to realtime changes with automatic reconnection
   */
  subscribe(
    channelName: string,
    table: string,
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
  ): () => void {
    // Unsubscribe existing channel if any
    this.unsubscribe(channelName);

    console.log(`[RealtimeManager] Subscribing to ${channelName}`);

    const channel = supabase.channel(channelName);

    // Configure subscription
    let subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
      },
      (payload) => {
        console.log(`[RealtimeManager] Change received on ${channelName}:`, payload);
        callback(payload);
      }
    );

    // Subscribe and handle errors
    subscription.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[RealtimeManager] Successfully subscribed to ${channelName}`);
        this.reconnectAttempts.set(channelName, 0);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[RealtimeManager] Channel error on ${channelName}:`, err);
        this.handleChannelError(channelName);
      } else if (status === 'TIMED_OUT') {
        console.error(`[RealtimeManager] Timeout on ${channelName}`);
        this.handleChannelError(channelName);
      }
    });

    this.channels.set(channelName, channel);

    // Return cleanup function
    return () => this.unsubscribe(channelName);
  }

  private handleChannelError(channelName: string) {
    const attempts = this.reconnectAttempts.get(channelName) || 0;

    if (attempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s
      console.log(`[RealtimeManager] Reconnecting ${channelName} in ${delay}ms (attempt ${attempts + 1})`);

      setTimeout(() => {
        this.reconnectChannel(channelName);
      }, delay);

      this.reconnectAttempts.set(channelName, attempts + 1);
    } else {
      console.error(`[RealtimeManager] Max reconnection attempts reached for ${channelName}`);
    }
  }

  private reconnectChannel(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`[RealtimeManager] Reconnecting channel ${channelName}`);
      // The channel will automatically reconnect through subscribe
      channel.subscribe();
    }
  }

  private reconnectAllChannels() {
    console.log('[RealtimeManager] Reconnecting all channels');
    this.channels.forEach((_, channelName) => {
      this.reconnectChannel(channelName);
    });
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`[RealtimeManager] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.reconnectAttempts.delete(channelName);
    }
  }

  cleanup() {
    console.log('[RealtimeManager] Cleaning up all channels');

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    // Unsubscribe all channels
    this.channels.forEach((_, channelName) => {
      this.unsubscribe(channelName);
    });
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();
