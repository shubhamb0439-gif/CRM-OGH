import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'MISSING',
    key: supabaseAnonKey ? 'present' : 'MISSING'
  });
  throw new Error('Supabase configuration is missing. Please check your .env file.');
}

console.log('Supabase client initializing with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web',
    },
  },
  db: {
    schema: 'public',
  },
});

// Log all database queries for debugging
const originalFrom = supabase.from.bind(supabase);
supabase.from = ((table: string) => {
  console.log(`[Supabase Query] Querying table: ${table}`);
  const builder = originalFrom(table);

  // Intercept the query execution
  const originalThen = builder.then?.bind(builder);
  if (originalThen) {
    builder.then = function(onfulfilled: any, onrejected: any) {
      console.log(`[Supabase Query] Executing query on table: ${table}`);
      const startTime = performance.now();

      return originalThen(
        (result: any) => {
          const duration = (performance.now() - startTime).toFixed(2);
          if (result.error) {
            console.error(`[Supabase Query] ❌ Error on ${table} (${duration}ms):`, result.error);
          } else {
            console.log(`[Supabase Query] ✅ Success on ${table} (${duration}ms):`, {
              count: result.data?.length || 0,
              data: result.data
            });
          }
          return onfulfilled ? onfulfilled(result) : result;
        },
        (error: any) => {
          const duration = (performance.now() - startTime).toFixed(2);
          console.error(`[Supabase Query] ❌ Promise rejection on ${table} (${duration}ms):`, error);
          return onrejected ? onrejected(error) : Promise.reject(error);
        }
      );
    };
  }

  return builder;
}) as any;

console.log('[Supabase] Client initialized successfully');

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  facility: string;
  state: string;
  source: 'Assessment' | 'Consultancy' | 'LinkedIn' | 'WhatsApp' | 'Call' | 'Email' | 'Referral' | 'Existing Client' | 'Ex-Client';
  score?: number;
  efficiency_level?: string;
  product_service: string;
  selected_services?: string[];
  status: string;
  closed_reason?: string;
  comments?: string;
  value_per_annum?: number;
  notes?: string;
  added_by?: string;
  added_by_email?: string;
  created_at: string;
  updated_at: string;
};

export type ConsultancyBooking = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string;
  state: string;
  city: string;
  facility: string;
  website: string | null;
  product_service: string;
  reason: string;
  preferred_date: string;
  preferred_time: string;
  timezone: string;
  timezone_value: string;
  ist_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Assessment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  facility: string;
  country?: string;
  state: string;
  specialties?: string[];
  score: number;
  time_taken: number;
  efficiency_level: string;
  comments?: string;
  product_service: string;
  selected_challenges?: string[];
  recommended_services?: string[];
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  description?: string;
  target_audience?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: string;
  created_at: string;
  updated_at: string;
};
