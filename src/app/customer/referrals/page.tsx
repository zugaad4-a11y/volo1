'use client';

import React, { useState } from 'react';
import { Users, Copy, CheckCircle2, MessageCircle, Mail, Link as LinkIcon, Loader2, AlertCircle, Clock, Star } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CustomerReferralsPage() {
    const [copied, setCopied] = useState(false);
    const { data, error, isLoading } = useSWR('/api/customer/referrals', fetcher);

    const code = data?.code || null;
    const stats = data?.stats || { successCount: 0, pendingCount: 0, totalEarned: 0, pendingAmount: 0 };
    const settings = data?.settings || { referrer_reward: 500, referee_reward: 200, min_bookings_to_qualify: 1 };
    const referrals: any[] = data?.referrals || [];
    const referralLink = code ? `${typeof window !== 'undefined' ? window.location.origin : 'https://volo.app'}/customer/login?ref=${code}` : '';

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF7A00]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Loading referrals...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Failed to load referral data.</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3 bg-[#FF7A00]/10 text-[#FF7A00] rounded-full mb-2">
                    <Users className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Refer a Friend, Earn Rewards</h1>
                <p className="text-slate-400 max-w-lg mx-auto">
                    Give your friends <span className="text-[#FF7A00] font-bold">₹{settings.referee_reward} off</span> their first booking, 
                    and you&apos;ll earn <span className="text-emerald-400 font-bold">₹{settings.referrer_reward}</span> when they complete their first {settings.min_bookings_to_qualify} booking(s).
                </p>
            </div>

            {/* Share Section */}
            <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-8 shadow-sm">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Your Unique Referral Link</label>
                        {code ? (
                            <div className="flex gap-2">
                                <div className="flex-1 bg-[#070B14] border border-white/[0.08] rounded-xl px-4 py-3 flex items-center overflow-hidden">
                                    <span className="text-sm font-medium text-slate-300 truncate">{referralLink}</span>
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="shrink-0 bg-[#FF7A00] hover:bg-orange-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                                    title="Copy Link"
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#070B14] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-500 italic">
                                Generating your code...
                            </div>
                        )}
                        {code && (
                            <p className="text-[10px] text-slate-500 font-mono">Code: <span className="text-[#FF7A00] font-bold">{code}</span></p>
                        )}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.06]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#0F172A] text-slate-500 font-medium">Or share via</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => referralLink && window.open(`https://wa.me/?text=${encodeURIComponent('Join VOLO and get ₹' + settings.referee_reward + ' off your first home service! ' + referralLink)}`, '_blank')}
                            className="p-3 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 rounded-full transition-colors cursor-pointer"
                        >
                            <MessageCircle className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => referralLink && window.open(`mailto:?subject=Join VOLO&body=${encodeURIComponent('Get ₹' + settings.referee_reward + ' off your first booking on VOLO! ' + referralLink)}`, '_blank')}
                            className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-full transition-colors cursor-pointer"
                        >
                            <Mail className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={copyToClipboard}
                            className="p-3 bg-[#FF7A00]/10 text-[#FF7A00] hover:bg-[#FF7A00]/20 rounded-full transition-colors cursor-pointer"
                        >
                            <LinkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Successful Referrals</p>
                    <p className="text-4xl font-black text-white">{stats.successCount}</p>
                </div>
                <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Pending Rewards</p>
                    <p className="text-4xl font-black text-amber-400">₹{stats.pendingAmount}</p>
                    <p className="text-[10px] text-slate-600 mt-2">{stats.pendingCount} awaiting completion</p>
                </div>
                <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Total Earned</p>
                    <p className="text-4xl font-black text-emerald-400">₹{stats.totalEarned}</p>
                </div>
            </div>

            {/* Referral history */}
            {referrals.length > 0 && (
                <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <h3 className="text-sm font-bold text-white">Referral History</h3>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                        {referrals.map((ref: any) => (
                            <div key={ref.id} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                                        <Users className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">New Customer Referred</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{new Date(ref.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        ref.status === 'REWARDED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                                        ref.status === 'QUALIFIED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                    }`}>
                                        {ref.status}
                                    </span>
                                    {ref.status === 'REWARDED' && (
                                        <span className="text-xs font-black text-emerald-400">+₹{ref.reward_amount}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {referrals.length === 0 && (
                <div className="bg-[#0F172A] border border-white/[0.06] rounded-2xl py-10 flex flex-col items-center gap-3">
                    <Clock className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">No referrals yet</p>
                    <p className="text-[10px] text-slate-600">Share your link above to start earning!</p>
                </div>
            )}

            {/* How it works */}
            <div className="pt-4">
                <h3 className="text-lg font-bold text-white text-center mb-6">How it works</h3>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                    <div className="flex-1 text-center space-y-2">
                        <div className="w-12 h-12 bg-[#FF7A00]/10 border border-[#FF7A00]/25 rounded-full flex items-center justify-center mx-auto text-[#FF7A00] font-bold text-lg mb-4">1</div>
                        <h4 className="font-bold text-sm text-white">Share Link</h4>
                        <p className="text-xs text-slate-500">Send your unique link to friends</p>
                    </div>
                    <div className="flex-1 text-center space-y-2">
                        <div className="w-12 h-12 bg-[#FF7A00]/10 border border-[#FF7A00]/25 rounded-full flex items-center justify-center mx-auto text-[#FF7A00] font-bold text-lg mb-4">2</div>
                        <h4 className="font-bold text-sm text-white">Friends Sign Up</h4>
                        <p className="text-xs text-slate-500">They get ₹{settings.referee_reward} off their first booking</p>
                    </div>
                    <div className="flex-1 text-center space-y-2">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-emerald-400 font-bold text-lg mb-4">3</div>
                        <h4 className="font-bold text-sm text-white">You Earn</h4>
                        <p className="text-xs text-slate-500">Get ₹{settings.referrer_reward} when they complete their first booking</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
