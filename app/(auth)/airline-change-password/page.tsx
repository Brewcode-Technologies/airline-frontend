'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdEmail, MdFlight } from 'react-icons/md';
import PasswordInput from '@/components/ui/PasswordInput';
import api from '@/services/api';

export default function AirlineChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const loginRes = await api.post('/auth/login', { email: form.email, password: form.currentPassword });
      const token = loginRes.data.data.token;
      await api.put('/auth/change-password',
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Password updated successfully!');
      setTimeout(() => router.push('/airline-login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally { setLoading(false); }
  };

  const tf = (label: string, key: keyof typeof form, placeholder: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {key === 'email'
        ? <div className="relative"><MdEmail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        : <PasswordInput value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} required focusColor="focus:ring-blue-500" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">✈ Airport Relief Logistics</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <MdFlight size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Change Password</h2>
              <p className="text-blue-200 text-sm">Update your airline account password</p>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {tf('Email',            'email',           'manager@airline.com')}
              {tf('Current Password', 'currentPassword', 'Your current password')}
              {tf('New Password', 'newPassword', 'Min. 6 characters')}

              {error   && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer">
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-5">
              <Link href="/airline-login" className="text-blue-600 hover:underline font-medium">← Back to Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
