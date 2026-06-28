'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UnassignedBookingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/manual-assignments');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400 text-sm">
      Redirecting to Manual Assignments...
    </div>
  );
}
