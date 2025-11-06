import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Reconnection state
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY = 1000; // 1 second base delay
const MAX_DELAY = 60000; // 60 seconds max delay

// Active channel references
let channelRefs: RealtimeChannel[] = [];

// Keepalive interval reference
let keepAliveInterval: number | null = null;

// Initialized flag
let isInitialized = false;

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
  const jitter = Math.random() * 0.3 * delay; // 0-30% jitter
  return delay + jitter;
}

/**
 * Cleanup all active subscriptions
 */
async function cleanupSubscriptions() {
  console.log('[RealtimeManager] Cleaning up subscriptions...');

  for (const channel of channelRefs) {
    try {
      await supabase.removeChannel(channel);
    } catch (error) {
      console.warn('[RealtimeManager] Error removing channel:', error);
    }
  }

  channelRefs = [];
}

/**
 * Subscribe to all required channels
 */
function subscribeToChannels() {
  console.log('[RealtimeManager] Subscribing to channels...');

  // Subscribe to leads table
  const leadsChannel = supabase
    .channel('leads-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
      console.log('[RealtimeManager] Leads change:', payload);
      // Dispatch custom event for React components to listen
      window.dispatchEvent(new CustomEvent('supabase:leads:change', { detail: payload }));
    })
    .subscribe((status) => {
      console.log('[RealtimeManager] Leads channel status:', status);
      handleSubscriptionStatus(status, leadsChannel);
    });

  // Subscribe to services table
  const servicesChannel = supabase
    .channel('services-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, (payload) => {
      console.log('[RealtimeManager] Services change:', payload);
      window.dispatchEvent(new CustomEvent('supabase:services:change', { detail: payload }));
    })
    .subscribe((status) => {
      console.log('[RealtimeManager] Services channel status:', status);
      handleSubscriptionStatus(status, servicesChannel);
    });

  // Subscribe to consultancy_bookings_v2 for dashboard
  const bookingsChannel = supabase
    .channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'consultancy_bookings_v2' }, (payload) => {
      console.log('[RealtimeManager] Bookings change:', payload);
      window.dispatchEvent(new CustomEvent('supabase:bookings:change', { detail: payload }));
    })
    .subscribe((status) => {
      console.log('[RealtimeManager] Bookings channel status:', status);
      handleSubscriptionStatus(status, bookingsChannel);
    });

  // Subscribe to assessments table
  const assessmentsChannel = supabase
    .channel('assessments-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, (payload) => {
      console.log('[RealtimeManager] Assessments change:', payload);
      window.dispatchEvent(new CustomEvent('supabase:assessments:change', { detail: payload }));
    })
    .subscribe((status) => {
      console.log('[RealtimeManager] Assessments channel status:', status);
      handleSubscriptionStatus(status, assessmentsChannel);
    });

  channelRefs = [leadsChannel, servicesChannel, bookingsChannel, assessmentsChannel];
}

/**
 * Handle subscription status changes
 */
function handleSubscriptionStatus(status: string, channel: RealtimeChannel) {
  if (status === 'SUBSCRIBED') {
    console.log('[RealtimeManager] Channel subscribed successfully');
    reconnectAttempts = 0; // Reset on successful connection
  } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
    console.warn('[RealtimeManager] Channel closed or error, scheduling reconnect...');
    scheduleReconnect();
  }
}

/**
 * Schedule reconnection with exponential backoff
 */
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[RealtimeManager] Max reconnection attempts reached. Manual refresh required.');
    return;
  }

  const delay = getBackoffDelay(reconnectAttempts);
  reconnectAttempts++;

  console.log(`[RealtimeManager] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  setTimeout(async () => {
    console.log('[RealtimeManager] Attempting to reconnect...');
    await cleanupSubscriptions();

    // Refresh session if needed
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[RealtimeManager] Session refresh error:', error);
    } else if (!session) {
      console.warn('[RealtimeManager] No active session found');
    }

    subscribeToChannels();
  }, delay);
}

/**
 * Keepalive ping to prevent connection timeout
 * Runs a lightweight query every 4-5 minutes
 */
function startKeepalive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  const KEEPALIVE_INTERVAL = 4.5 * 60 * 1000; // 4.5 minutes

  keepAliveInterval = window.setInterval(async () => {
    try {
      console.log('[RealtimeManager] Sending keepalive ping...');
      const { error } = await supabase.from('leads').select('id').limit(1).maybeSingle();

      if (error) {
        console.warn('[RealtimeManager] Keepalive failed:', error);
        scheduleReconnect();
      } else {
        console.log('[RealtimeManager] Keepalive successful');
      }
    } catch (err) {
      console.error('[RealtimeManager] Keepalive error:', err);
    }
  }, KEEPALIVE_INTERVAL);
}

/**
 * Handle page visibility changes
 * Immediately reconnect when tab becomes visible
 */
function handleVisibilityChange() {
  if (document.hidden) {
    console.log('[RealtimeManager] Tab hidden, pausing activity');
  } else {
    console.log('[RealtimeManager] Tab visible, reconnecting channels...');
    reconnectAttempts = 0; // Reset attempts on manual visibility change
    cleanupSubscriptions().then(() => {
      subscribeToChannels();
    });
  }
}

/**
 * Initialize realtime manager
 * Call this once at app startup
 */
export function initRealtimeManager() {
  if (isInitialized) {
    console.warn('[RealtimeManager] Already initialized');
    return;
  }

  console.log('[RealtimeManager] Initializing...');
  isInitialized = true;

  // Initial subscription
  subscribeToChannels();

  // Start keepalive
  startKeepalive();

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Listen for auth state changes (session refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[RealtimeManager] Auth state changed:', event);

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('[RealtimeManager] Reconnecting after auth change...');
      await cleanupSubscriptions();
      subscribeToChannels();
    } else if (event === 'SIGNED_OUT') {
      console.log('[RealtimeManager] Cleaning up after sign out');
      await cleanupSubscriptions();
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    console.log('[RealtimeManager] Page unloading, cleaning up...');
    cleanupSubscriptions();
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
    }
  });
}

// Legacy compatibility - export a manager-like object
export const realtimeManager = {
  subscribe: () => {
    console.warn('[RealtimeManager] Legacy subscribe() called - use initRealtimeManager() instead');
    return () => {};
  },
  unsubscribe: () => {
    console.warn('[RealtimeManager] Legacy unsubscribe() called');
  },
  cleanup: () => {
    console.log('[RealtimeManager] Legacy cleanup() called');
    cleanupSubscriptions();
  }
};
