'use client';

import React, { useState } from 'react';

export default function CustomerOnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to complete profile onboarding.');
        return;
      }

      window.location.href = '/customer/dashboard';
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to complete profile onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center font-extrabold text-2xl animate-pulse">
            ✨
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete Profile</h1>
          <p className="text-slate-400 text-sm">
            Please fill in your details to finalize your customer registration
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Full Name (Required)</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm outline-none text-white placeholder-slate-600 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm outline-none text-white placeholder-slate-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
