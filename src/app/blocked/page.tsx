import React from 'react';

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-16 w-16 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center font-extrabold text-3xl animate-bounce">
            🚫
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-red-500">Account Suspended</h1>
          <p className="text-slate-400 text-sm">
            Your VOLO user account has been deactivated or suspended by system administrators.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-left">
          <h2 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Need Assistance?</h2>
          <p className="text-xs text-slate-400">
            If you believe this is a mistake or need your account re-activated, please contact our support desk:
          </p>
          <div className="text-sm font-medium text-violet-400 space-y-1">
            <div>Email: <a href="mailto:support@volo.in" className="underline hover:text-violet-300">support@volo.in</a></div>
            <div>Phone: +91 80 4567 8901</div>
          </div>
        </div>

        <a
          href="/"
          className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg py-2.5 text-sm transition-colors"
        >
          Return to Homepage
        </a>
      </div>
    </div>
  );
}
