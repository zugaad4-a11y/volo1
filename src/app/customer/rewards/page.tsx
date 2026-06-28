'use client';

import React from 'react';
import { Gift, Star, Award, Clock, ArrowRight } from 'lucide-react';

export default function CustomerRewardsPage() {
    const rewards = [
        { id: 1, title: '₹100 Off Any Service', cost: 200 },
        { id: 2, title: '₹500 Off Any Service', cost: 1000 },
        { id: 3, title: 'Free AC Inspection', cost: 1500 },
        { id: 4, title: 'Premium Deep Clean Upgrade', cost: 2500 },
    ];

    // Real points: always 0 until rewards table is implemented
    const currentPoints = 0;
    const tier = 'Bronze Member';
    const nextTier = 'Silver Member';
    const pointsToNextTier = 1000;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header section */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Award className="w-4 h-4" />
                            {tier}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white select-none">VOLO Rewards</h1>
                        <p className="text-sm text-indigo-200/80 max-w-md">Earn points on every booking and referral. Redeem them for exclusive discounts and free services.</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center min-w-[200px]">
                        <p className="text-xs text-indigo-200 uppercase font-semibold tracking-wider mb-1">Available Balance</p>
                        <p className="text-4xl font-black text-white flex items-center justify-center gap-2">
                            <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                            {currentPoints}
                        </p>
                        <p className="text-[10px] text-indigo-300 mt-2">Complete bookings to earn points</p>
                    </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-8 relative z-10">
                    <div className="flex justify-between text-xs text-indigo-200 mb-2 font-medium">
                        <span>{tier}</span>
                        <span>{pointsToNextTier} points to {nextTier}</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-white/5">
                        <div className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full" style={{ width: `${(currentPoints / (currentPoints + pointsToNextTier)) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Redeem Rewards */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#FF7A00]" />
                        Available Rewards
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rewards.map((reward) => (
                            <div key={reward.id} className="bg-[#0F172A] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between group hover:border-[#FF7A00]/30 transition-all">
                                <div className="space-y-1 mb-4">
                                    <h3 className="font-bold text-white group-hover:text-[#FF7A00] transition-colors">{reward.title}</h3>
                                    <p className="text-xs font-semibold text-slate-500">{reward.cost} Points Required</p>
                                </div>
                                <button 
                                    className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors bg-[#070B14] text-slate-400 cursor-not-allowed border border-white/[0.06]"
                                    disabled
                                >
                                    Not Enough Points
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Point History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Recent Activity
                    </h2>
                    
                    <div className="bg-[#0F172A] border border-white/[0.08] rounded-2xl overflow-hidden">
                        <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
                            <Star className="w-8 h-8 text-slate-600" />
                            <p className="text-sm font-semibold text-slate-400">No reward activity yet</p>
                            <p className="text-[10px] text-slate-600">Complete bookings to start earning points</p>
                        </div>
                        <button className="w-full p-3 text-[10px] font-bold text-[#FF7A00] uppercase tracking-wider hover:bg-white/[0.02] transition-colors border-t border-white/[0.06] flex items-center justify-center gap-1">
                            View Full History <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
