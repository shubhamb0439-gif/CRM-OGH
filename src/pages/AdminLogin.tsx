import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const timeout = setTimeout(() => {
        setError('Login is taking too long. Please check your internet connection.');
        setLoading(false);
      }, 15000);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      clearTimeout(timeout);

      if (authError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', authData.user.email)
        .maybeSingle();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        setError('You are not authorized to access the admin panel');
        setLoading(false);
        return;
      }

      supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('email', authData.user.email)
        .then(() => {
          console.log('Last login updated');
        })
        .catch((err) => {
          console.error('Failed to update last login:', err);
        });

      setLoading(false);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 overflow-auto">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <img src="/og logo.png" alt="Healthcare CRM" className="h-20 w-auto" />
          </div>

          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
            Admin Login
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Access the CRM admin panel
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93] focus:border-transparent"
                  placeholder="admin@oghealthcare.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#531B93] focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white py-3 rounded-lg font-semibold hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all transform hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Authorized personnel only. Contact your administrator for access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
