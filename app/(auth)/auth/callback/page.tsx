'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

const ROLE_REDIRECT: Record<string, string> = {
  admin:   '/admin/dashboard',
  airline: '/airline/dashboard',
  driver:  '/driver/orders',
};

const ROLE_LOGIN: Record<string, string> = {
  admin:   '/admin-login',
  airline: '/airline-login',
  driver:  '/driver-login',
};

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role  = params.get('role');
    const name  = params.get('name');
    const id    = params.get('id');

    if (!token || !role) {
      router.replace('/admin-login?error=google_failed');
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name || '');
    localStorage.setItem('userId', id || '');

    router.replace(ROLE_REDIRECT[role] || ROLE_LOGIN[role] || '/admin-login');
  }, [router]);

  return <Spinner />;
}
