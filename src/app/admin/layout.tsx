import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionCookie } from '@/lib/session';
import AdminShell from '@/components/admin/layout/AdminShell';
import { supabaseAdmin } from '@/lib/supabase-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('volo_session')?.value;

  if (!sessionToken) {
    redirect('/admin/login');
  }

  const session = await verifySessionCookie(sessionToken);

  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  // Fetch admin profile details
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', session.user_id)
    .single();

  return (
    <AdminShell
      adminName={user?.full_name || 'Super Admin'}
      adminAvatar={user?.avatar_url || ''}
    >
      {children}
    </AdminShell>
  );
}
