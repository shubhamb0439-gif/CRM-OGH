import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { initRealtimeManager } from './lib/realtimeManager';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AssessmentSubmission from './pages/AssessmentSubmission';
import AssessmentReport from './pages/AssessmentReport';
import ConsultancyBooking from './pages/ConsultancyBooking';
import Dashboard from './pages/Dashboard';
import LeadDatabase from './pages/LeadDatabase';
import LeadProfile from './pages/LeadProfile';
import BookingSubmissions from './pages/BookingSubmissions';
import Campaigns from './pages/Campaigns';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    console.log('[App] 🎬 Application starting...');
    console.log('[App] Timestamp:', new Date().toISOString());
    console.log('[App] Initializing realtime manager...');

    initRealtimeManager();
    console.log('[App] ✅ Realtime manager initialized');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowDevtools(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="h-full w-full">
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/admin" element={<AdminLogin />} />

          <Route path="/assessment" element={<AssessmentSubmission />} />

          <Route path="/assessment-report/:id" element={<AssessmentReport />} />

          <Route path="/booking" element={<ConsultancyBooking />} />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute>
                <LeadDatabase />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/leads/:id"
            element={
              <ProtectedRoute>
                <LeadProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute>
                <BookingSubmissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/campaigns"
            element={
              <ProtectedRoute>
                <Campaigns />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
    {showDevtools && <ReactQueryDevtools initialIsOpen={true} />}
    </QueryClientProvider>
    </ErrorBoundary>
  );
}
