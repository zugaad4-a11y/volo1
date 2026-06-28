'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/worker/dashboard');
  }, [router]);

  return null;
}
