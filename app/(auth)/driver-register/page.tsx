'use client';

import Link from 'next/link';
import { MdLocalShipping, MdLock } from 'react-icons/md';

export default function DriverRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">✈ Airport Relief Logistics</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-500 px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MdLocalShipping size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Driver Account</h2>
              <p className="text-orange-100 text-sm">Access restricted</p>
            </div>
          </div>
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto">
              <MdLock size={32} className="text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Driver accounts are created by Admin only</h3>
            <p className="text-sm text-gray-500">You cannot self-register. Contact your administrator to get your login credentials.</p>
            <Link href="/driver-login" className="inline-block mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
