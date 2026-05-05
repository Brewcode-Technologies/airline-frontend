'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { MdEmail, MdAdminPanelSettings } from 'react-icons/md';
import PasswordInput from '@/components/ui/PasswordInput';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function AdminLoginContent() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);
  const params      = useSearchParams();
  const googleError = params.get('error');

  const [form, setForm]           = useState({ email: '', password: '' });
  const [tab, setTab]             = useState<'email' | 'google'>('email');
  const [roleError, setRoleError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError('');
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      if (result.payload.user.role !== 'admin') { setRoleError('Access denied. This portal is for admins only.'); return; }
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Airline Logistics</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-600 px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MdAdminPanelSettings size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Portal</h2>
              <p className="text-purple-200 text-sm">Sign in to manage the platform</p>
            </div>
          </div>

          <div className="p-6">
            <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
              {(['email', 'google'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'email' ? 'Email & Password' : 'Google'}
                </button>
              ))}
            </div>

            {tab === 'email' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <MdEmail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="admin@airline.com"
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters" required focusColor="focus:ring-purple-500" />
                </div>

                {(error || roleError) && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{roleError || error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer">
                  {loading ? 'Signing in…' : 'Sign in as Admin'}
                </button>

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
                  <p className="font-semibold text-gray-600 mb-1">Demo Credentials</p>
                  <p>Email: <span className="font-mono text-gray-800 select-all">admin@airline.com</span></p>
                  <p>Password: <span className="font-mono text-gray-800 select-all">password123</span></p>
                </div>

                <div className="flex justify-end text-sm">
                  <Link href="/admin-change-password" className="text-purple-600 hover:underline font-medium">Change password</Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {googleError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">Google sign-in failed. Please try again.</p>
                )}
                <a href={`${API}/auth/google`}
                  className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                  Continue with Google
                </a>
                <p className="text-xs text-gray-400 text-center">Only admin accounts will be granted access.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><AdminLoginContent /></Suspense>;
}
