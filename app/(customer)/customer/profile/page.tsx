'use client';

import { useEffect, useState } from 'react';
import { MdPerson, MdEmail, MdPhone, MdLocationOn, MdSave } from 'react-icons/md';
import api from '@/services/api';

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', gate: '', seatNumber: '', airport: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer/profile');
      setProfile(data.data);
      setForm({
        name: data.data.name || '',
        phone: data.data.phone || '',
        gate: data.data.gate || '',
        seatNumber: data.data.seatNumber || '',
        airport: data.data.airport || '',
      });
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      const { data } = await api.put('/customer/profile', form);
      setProfile(data.data);
      setSuccess(true);
      localStorage.setItem('name', form.name);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) { /* ignore */ }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading profile...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account details and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{profile?.name}</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Customer</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Full Name</label>
            <div className="relative">
              <MdPerson size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
            <div className="relative">
              <MdEmail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={profile?.email || ''} disabled
                className="w-full border-2 border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-600 bg-gray-100" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
            <div className="relative">
              <MdPhone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Airport</label>
              <input type="text" value={form.airport} onChange={(e) => setForm({ ...form, airport: e.target.value })}
                placeholder="e.g. JFK, LAX"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Default Gate</label>
              <input type="text" value={form.gate} onChange={(e) => setForm({ ...form, gate: e.target.value })}
                placeholder="e.g. Gate A2"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Seat Number</label>
            <div className="relative">
              <MdLocationOn size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })}
                placeholder="e.g. 14B"
                className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer">
            <MdSave size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p>Role: Customer</p>
        </div>
      </div>
    </div>
  );
}
