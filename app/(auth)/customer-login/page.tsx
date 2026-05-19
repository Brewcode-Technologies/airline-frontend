'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { MdEmail, MdPerson } from 'react-icons/md';
import PasswordInput from '@/components/ui/PasswordInput';
import Link from 'next/link';

function CustomerLoginContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [roleError, setRoleError] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'customer') router.replace('/customer/dashboard');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError('');
    setFailed(false);
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      if (result.payload.user.role !== 'customer') {
        localStorage.clear();
        setRoleError('Access denied. This portal is for customers only.');
        setFailed(true);
        return;
      }
      router.push('/customer/dashboard');
    } else {
      setFailed(true);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Airline Logistics</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-600 px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MdPerson size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Customer Portal</h2>
              <p className="text-purple-100 text-sm">Sign in to order items</p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <MdEmail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@email.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password" required focusColor="focus:ring-purple-500" />
              </div>

              {(error || roleError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-red-600">{roleError || error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/customer-register" className="text-purple-600 hover:underline font-medium">
                  Register
                </Link>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
                <p className="font-semibold text-gray-600 mb-1">Demo Credentials</p>
                <p>Email: <span className="font-mono text-gray-800 select-all">customer1@test.com</span></p>
                <p>Password: <span className="font-mono text-gray-800 select-all">password123</span></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return <Suspense><CustomerLoginContent /></Suspense>;
}
