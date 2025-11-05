import { Link } from 'react-router-dom';
import { Shield, ClipboardCheck, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-auto">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src="/og logo.png" alt="Healthcare CRM" className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Healthcare CRM Platform
          </h1>
          <p className="text-xl text-slate-600">
            Choose your access portal below
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
            <Link
              to="/assessment"
              className="hidden md:block group bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 hover:shadow-2xl hover:border-[#2563EB] transition-all transform hover:scale-105"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#2563EB] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <ClipboardCheck className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">
                Assessment Submission
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Take the healthcare efficiency assessment
              </p>
              <div className="text-center">
                <span className="inline-block px-6 py-3 bg-[#2563EB] text-white rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-md">
                  Start Assessment
                </span>
              </div>
            </Link>

            <Link
              to="/booking"
              className="hidden md:block group bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 hover:shadow-2xl hover:border-[#531B93] transition-all transform hover:scale-105"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-[#531B93] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">
                Book Consultation
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Schedule a free consultation session
              </p>
              <div className="text-center">
                <span className="inline-block px-6 py-3 bg-[#531B93] text-white rounded-lg font-semibold hover:bg-[#3d1470] transition-colors shadow-md">
                  Book Now
                </span>
              </div>
            </Link>

            <Link
              to="/admin"
              className="group bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 hover:shadow-2xl hover:border-slate-400 transition-all transform hover:scale-105 md:col-auto mx-auto w-full max-w-md md:max-w-none"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#531B93] to-[#2563EB] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">
                Admin Panel
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Access the CRM dashboard
              </p>
              <div className="text-center">
                <span className="inline-block px-6 py-3 bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white rounded-lg font-semibold hover:from-[#3d1470] hover:to-[#1d4ed8] transition-colors shadow-md">
                  Admin Login
                </span>
              </div>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Direct Access URLs:</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">Assessment:</span>
                <code className="bg-slate-100 px-3 py-1 rounded">/assessment</code>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">Booking:</span>
                <code className="bg-slate-100 px-3 py-1 rounded">/booking</code>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">Admin:</span>
                <code className="bg-slate-100 px-3 py-1 rounded">/admin</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
