import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkAuth();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      setIsAuthorized(!!adminData);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setIsAuthorized(false);
    }
  };

  if (isAuthenticated === null || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#531B93] mx-auto mb-4"></div>
          <div className="text-slate-600">Verifying access...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
