'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/dashboard');
  }, [router]);

  return null;
}
