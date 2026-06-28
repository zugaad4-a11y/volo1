'use client';

import React, { useState, useEffect } from 'react';
import { 
    Star, 
    Trophy, 
    Gift, 
    Users,
    AlertTriangle,
    Loader2,
    Settings,
    Save,
    CheckCircle
} from 'lucide-react';
import { supabaseClient as supabase } from '@/lib/supabase-client';

type Tab = 'reviews' | 'rankings' | 'incentives' | 'referrals';

export default function AdminPerformanceDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('reviews');
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [refSettings, setRefSettings] = useState<any[]>([]);
    const [refSaving, setRefSaving] = useState<string | null>(null);
    const [refSaved, setRefSaved] = useState<string | null>(null);
    const [referrals, setReferrals] = useState<any[]>([]);
    const [rewardingId, setRewardingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [reviewsRes, workersRes] = await Promise.all([
                    supabase
                        .from('reviews')
                        .select('id, rating, comment, created_at, bookings(service_items(name)), users!reviews_customer_id_fkey(full_name), workers(users(full_name))')
                        .order('created_at', { ascending: false })
                        .limit(20),
                    supabase
                        .from('workers')
                        .select('id, average_rating, total_jobs_completed, users(full_name)')
                        .order('average_rating', { ascending: false })
                        .limit(20)
                ]);
                setReviews(reviewsRes.data || []);
                setWorkers(workersRes.data || []);

                // Fetch referral settings via admin API
                const settingsRes = await fetch('/api/admin/referral-settings');
                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setRefSettings(settingsData.settings || []);
                }

                // Fetch all referrals
                const referralsRes = await fetch('/api/admin/referrals');
                if (referralsRes.ok) {
                    const referralsData = await referralsRes.json();
                    setReferrals(referralsData.referrals || []);
                }
            } catch (err) {
                console.error('Failed to fetch performance data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '—';
    const negativeCount = reviews.filter(r => r.rating <= 2).length;

    const renderTabs = () => {
        const tabs: { id: Tab, label: string, icon: React.ReactNode }[] = [
            { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4 mr-2" /> },
            { id: 'rankings', label: 'Worker Rankings', icon: <Trophy className="w-4 h-4 mr-2" /> },
            { id: 'incentives', label: 'Incentives', icon: <Gift className="w-4 h-4 mr-2" /> },
            { id: 'referrals', label: 'Referrals', icon: <Users className="w-4 h-4 mr-2" /> },
        ];

        return (
            <div className="flex space-x-1 border-b border-slate-700/50 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === tab.id
                                ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white select-none">Performance & Rewards</h1>
                <p className="text-xs text-slate-400 select-none">Manage worker performance, reviews, incentives, and referral programs.</p>
            </div>

            {renderTabs()}

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Loading data...</span>
                    </div>
                ) : (
                    <>
                        {activeTab === 'reviews' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
                                    <div className="flex space-x-2">
                                        <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">Avg Rating: {avgRating}</span>
                                        {negativeCount > 0 && (
                                            <span className="bg-red-900/30 text-red-400 border border-red-800/50 text-xs px-2 py-1 rounded flex items-center">
                                                <AlertTriangle className="w-3 h-3 mr-1" /> Negative: {negativeCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {reviews.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 text-sm">No reviews found.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                                                <tr>
                                                    <th className="px-4 py-3">Worker</th>
                                                    <th className="px-4 py-3">Service</th>
                                                    <th className="px-4 py-3">Rating</th>
                                                    <th className="px-4 py-3">Review</th>
                                                    <th className="px-4 py-3">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {reviews.map((review) => (
                                                    <tr key={review.id} className="hover:bg-slate-800/30">
                                                        <td className="px-4 py-3 font-medium text-white">{review.workers?.users?.full_name || '—'}</td>
                                                        <td className="px-4 py-3">{review.bookings?.service_items?.name || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center">
                                                                <span className="mr-1">{review.rating}</span>
                                                                <Star className={`w-3 h-3 ${review.rating >= 4 ? 'text-amber-400' : 'text-slate-500'}`} />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 max-w-xs truncate">{review.comment || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'rankings' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-white">Worker Rankings</h2>
                                </div>
                                {workers.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 text-sm">No worker data available.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                                                <tr>
                                                    <th className="px-4 py-3">Rank</th>
                                                    <th className="px-4 py-3">Worker</th>
                                                    <th className="px-4 py-3">Avg Rating</th>
                                                    <th className="px-4 py-3">Jobs Completed</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {workers.map((worker, index) => (
                                                    <tr key={worker.id} className="hover:bg-slate-800/30">
                                                        <td className="px-4 py-3">
                                                            {index === 0 ? <Trophy className="w-4 h-4 text-amber-400" /> : `#${index + 1}`}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-white">{worker.users?.full_name || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-amber-400" />
                                                                <span>{worker.average_rating ? Number(worker.average_rating).toFixed(1) : 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">{worker.total_jobs_completed ?? 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'incentives' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-white">Incentive Rules</h2>
                                </div>
                                <div className="text-center py-12 space-y-2">
                                    <Gift className="w-10 h-10 text-slate-600 mx-auto" />
                                    <p className="text-slate-500 text-sm">No active incentive rules configured yet.</p>
                                    <p className="text-slate-600 text-xs">Incentive management will be available in a future update.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'referrals' && (
                            <div className="space-y-8">
                                {/* Referral List */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-400" />
                                        <h2 className="text-lg font-semibold text-white">All Referrals</h2>
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{referrals.length}</span>
                                    </div>

                                    {referrals.length === 0 ? (
                                        <div className="text-center py-10 space-y-2">
                                            <Users className="w-10 h-10 text-slate-700 mx-auto" />
                                            <p className="text-slate-500 text-sm">No referrals yet</p>
                                            <p className="text-slate-600 text-xs">Referral activity will appear here once customers/workers start sharing their links.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-800 rounded-xl overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="bg-slate-950/50 border-b border-slate-800">
                                                            {['Referrer', 'Referred User', 'Code', 'Role', 'Reward', 'Status', 'Date', 'Action'].map(h => (
                                                                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase text-slate-500 tracking-wider">{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/50">
                                                        {referrals.map((ref: any) => (
                                                            <tr key={ref.id} className="hover:bg-slate-800/20 transition-colors">
                                                                <td className="px-3 py-2.5">
                                                                    <p className="font-bold text-white">{ref.referrer?.full_name || '—'}</p>
                                                                    <p className="text-slate-500 text-[10px] font-mono">{ref.referrer?.phone}</p>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <p className="font-bold text-slate-300">{ref.referred?.full_name || '—'}</p>
                                                                    <p className="text-slate-500 text-[10px] font-mono">{ref.referred?.phone}</p>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className="font-mono text-[10px] text-slate-400">{ref.referral_code}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                                                                        ref.role === 'customer' ? 'bg-blue-900/20 text-blue-400 border-blue-900/40' : 'bg-amber-900/20 text-amber-400 border-amber-900/40'
                                                                    }`}>{ref.role}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className="font-bold text-emerald-400">₹{ref.reward_amount}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                                        ref.status === 'REWARDED' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/40' :
                                                                        ref.status === 'QUALIFIED' ? 'bg-blue-900/20 text-blue-400 border-blue-900/40' :
                                                                        'bg-amber-900/20 text-amber-400 border-amber-900/40'
                                                                    }`}>{ref.status}</span>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-slate-500">
                                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-3 py-2.5">
                                                                    {ref.status !== 'REWARDED' && (
                                                                        <button
                                                                            disabled={rewardingId === ref.id}
                                                                            onClick={async () => {
                                                                                setRewardingId(ref.id);
                                                                                try {
                                                                                    await fetch('/api/admin/referrals', {
                                                                                        method: 'PATCH',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ referral_id: ref.id }),
                                                                                    });
                                                                                    const r = await fetch('/api/admin/referrals');
                                                                                    if (r.ok) setReferrals((await r.json()).referrals || []);
                                                                                } finally {
                                                                                    setRewardingId(null);
                                                                                }
                                                                            }}
                                                                            className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-[9px] font-black rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            {rewardingId === ref.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                                            {rewardingId === ref.id ? '...' : 'Mark Rewarded'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Settings Section */}
                                <div className="space-y-4 border-t border-slate-800 pt-6">
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-emerald-400" />
                                        <h2 className="text-lg font-semibold text-white">Referral Reward Settings</h2>
                                    </div>
                                    <p className="text-xs text-slate-400 -mt-3">Configure reward amounts. Changes apply immediately to new referrals.
</p>

                                {refSettings.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-sm">Loading settings...</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {refSettings.map((setting) => (
                                            <div key={setting.id} className="border border-slate-700 bg-slate-800/30 p-5 rounded-xl space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-white capitalize flex items-center gap-2">
                                                        {setting.role === 'customer' ? <Users className="w-4 h-4 text-blue-400" /> : <Trophy className="w-4 h-4 text-amber-400" />}
                                                        {setting.role === 'customer' ? 'Customer' : 'Worker'} Referral
                                                    </h3>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        setting.active ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-slate-700 text-slate-400 border-slate-600'
                                                    }`}>{setting.active ? 'Active' : 'Disabled'}</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Referrer Reward (₹)</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            defaultValue={setting.referrer_reward}
                                                            id={`referrer_reward_${setting.role}`}
                                                            className="w-full mt-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                                                        />
                                                        <p className="text-[9px] text-slate-500 mt-1">Paid to the person who referred</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Referee Discount (₹)</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            defaultValue={setting.referee_reward}
                                                            id={`referee_reward_${setting.role}`}
                                                            className="w-full mt-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                                                        />
                                                        <p className="text-[9px] text-slate-500 mt-1">Discount given to the new signup</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Min Bookings to Qualify</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            defaultValue={setting.min_bookings_to_qualify}
                                                            id={`min_bookings_${setting.role}`}
                                                            className="w-full mt-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
                                                        />
                                                        <p className="text-[9px] text-slate-500 mt-1">Number of bookings referee must complete before reward is paid</p>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={refSaving === setting.role}
                                                    onClick={async () => {
                                                        const referrerReward = (document.getElementById(`referrer_reward_${setting.role}`) as HTMLInputElement)?.value;
                                                        const refereeReward = (document.getElementById(`referee_reward_${setting.role}`) as HTMLInputElement)?.value;
                                                        const minBookings = (document.getElementById(`min_bookings_${setting.role}`) as HTMLInputElement)?.value;
                                                        setRefSaving(setting.role);
                                                        try {
                                                            await fetch('/api/admin/referral-settings', {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    role: setting.role,
                                                                    referrer_reward: Number(referrerReward),
                                                                    referee_reward: Number(refereeReward),
                                                                    min_bookings_to_qualify: Number(minBookings),
                                                                    active: setting.active,
                                                                })
                                                            });
                                                            setRefSaved(setting.role);
                                                            setTimeout(() => setRefSaved(null), 2000);
                                                        } finally {
                                                            setRefSaving(null);
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                                >
                                                    {refSaving === setting.role ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : refSaved === setting.role ? (
                                                        <><CheckCircle className="w-4 h-4" /> Saved!</>
                                                    ) : (
                                                        <><Save className="w-4 h-4" /> Save Changes</>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
