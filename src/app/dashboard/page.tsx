'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const role = user?.role;
  if (role === 'shipper') router.replace('/dashboard/shipper');
  else if (role === 'driver') router.replace('/dashboard/driver');
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <p className="text-slate-600">Redirecting...</p>
    </div>
  );
}
