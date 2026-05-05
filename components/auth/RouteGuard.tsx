'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';
import Spinner from '@/components/ui/Spinner';

interface RouteGuardProps {
  allowedRole: 'admin' | 'airline' | 'driver' | 'vendor';
  loginPath: string;
  children: React.ReactNode;
}

export default function RouteGuard({ allowedRole, loginPath, children }: RouteGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');

    if (!token || role !== allowedRole) {
      router.replace(loginPath);
      return;
    }

    // rehydrate Redux auth.user from token after page refresh
    dispatch(fetchMe()).unwrap()
      .then(() => setAuthorized(true))
      .catch(() => {
        localStorage.clear();
        router.replace(loginPath);
      });
  }, []);

  if (!authorized) return <Spinner fullPage label="Checking access…" />;
  return <>{children}</>;
}
