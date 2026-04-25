'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdLogout, MdNotifications } from 'react-icons/md';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface TopbarProps {
  logoutRedirect: string;
  avatarColor?:   string;
  portalLabel?:   string;
}

export default function Topbar({ logoutRedirect, avatarColor = 'bg-blue-600', portalLabel }: TopbarProps) {
  const router = useRouter();
  const [name, setName] = useState('User');
  const [role, setRole] = useState('');
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem('name') || 'User');
    setRole(localStorage.getItem('role') || '');
  }, []);

  const handleConfirmLogout = () => {
    localStorage.clear();
    router.push(logoutRedirect);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between pl-16 lg:pl-6 pr-4 lg:pr-6">
        <div />
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <MdNotifications size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight">{name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
            <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 cursor-pointer transition-colors"
          >
            <MdLogout size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {showLogout && (
        <ConfirmModal
          title="Sign Out"
          message={`Are you sure you want to sign out of the ${portalLabel || ''} portal?`}
          confirmLabel="Sign Out"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}
