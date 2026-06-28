'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errCode = data.error || 'ADMIN_WRONG_CREDS';
        if (errCode === 'UNAUTHORIZED_ROLE') {
          setErrorMsg("You don't have access to this portal.");
        } else if (errCode === 'ACCOUNT_BLOCKED') {
          setErrorMsg('Account suspended. Contact support.');
        } else {
          setErrorMsg('Invalid email or password.');
        }
        return;
      }

      router.push(data.redirectTo || '/admin/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <img 
            src="/images/logo.jpeg" 
            alt="VOLO Logo" 
            className="h-12 w-12 rounded-xl object-contain border border-slate-800 shadow-md" 
          />
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Portal</h1>
          <p className="text-slate-400 text-sm">
            Sign in with email credentials to manage the platform
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Email Address</label>
            <input
              type="email"
              placeholder="admin@volo.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg px-3 py-2.5 text-sm outline-none text-white placeholder-slate-600 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-lg px-3 py-2.5 text-sm outline-none text-white placeholder-slate-600 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
