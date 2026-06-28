'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { sendOtp, verifyOtp } from '@/lib/firebase-client';
import { cleanupEnterpriseRecaptcha } from '@/lib/recaptcha-client';
import { 
  Briefcase, User, Phone, ShieldCheck, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, Loader2, Sparkles, Lock, 
  Wrench, Zap, Snowflake, Hammer, Star, ChevronDown, ArrowRight, 
  Award, Mail, MapPin, PhoneCall, Check, Play, Apple, X, 
  Users, Search, Shield, ChevronLeft, CheckCircle
} from 'lucide-react';

const PHONE_REGEX = /^\+91[6-9]\d{9}$/;

interface ServiceItem {
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  price: string;
  color: string;
  badge: string;
}

const PRESET_SERVICES: ServiceItem[] = [
  { name: 'Electrical Repair', desc: 'Fan installation, short circuit fixes, switchboard mounts', icon: Zap, price: '₹149', color: 'bg-orange-50 text-[#FF7A00] border-orange-100', badge: 'Popular' },
  { name: 'Plumbing Works', desc: 'Leakage repairs, tap fixes, pipe installations', icon: Wrench, price: '₹199', color: 'bg-blue-50 text-[#0A58CA] border-blue-100', badge: 'Best Rate' }
];

export default function HomeLandingPage() {
  // Navigation & UI States
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth states
  const [selectedRole, setSelectedRole] = useState<'customer' | 'worker'>('customer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [authStep, setAuthStep] = useState<'PHONE' | 'OTP' | 'SET_PIN'>('PHONE');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [pinSetup, setPinSetup] = useState('');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [redirectToUrl, setRedirectToUrl] = useState('');
  const [isPinSetupFocused, setIsPinSetupFocused] = useState(false);

  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const pinSetupInputRef = useRef<HTMLInputElement>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    if (!PHONE_REGEX.test(formattedPhone)) {
      setAuthError('Enter a valid 10-digit Indian mobile number');
      setAuthLoading(false);
      return;
    }

    try {
      cleanupEnterpriseRecaptcha();
      console.log("Sending OTP to:", formattedPhone);
      const result = await sendOtp(formattedPhone);
      confirmationResultRef.current = result;
      setAuthSuccess('Code sent successfully.');
      setAuthStep('OTP');
    } catch (err: unknown) {
      console.error(err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/invalid-phone-number') {
        setAuthError('Enter a valid 10-digit Indian mobile number');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setAuthError('Too many attempts. Try again after 10 minutes.');
      } else if (firebaseError.code === 'auth/invalid-app-credential') {
        setAuthError('App credential verification failed (auth/invalid-app-credential). Please verify your Firebase authorized domains, API Key restrictions, or ensure the Blaze plan is active.');
      } else {
        setAuthError('Could not send verification code. Please try again.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    if (otpValue.length !== 6) {
      setAuthError('Enter a 6-digit confirmation code.');
      setAuthLoading(false);
      return;
    }

    try {
      if (!confirmationResultRef.current) {
        throw new Error('NO_CONFIRMATION_RESULT');
      }

      const idToken = await verifyOtp(confirmationResultRef.current, otpValue);

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errCode = data.error || 'FIREBASE_TOKEN_INVALID';
        mapServerErrors(errCode);
        return;
      }

      if (data.promptPinSetup) {
        setRedirectToUrl(data.redirectTo || (selectedRole === 'worker' ? '/worker/dashboard' : '/customer/dashboard'));
        setAuthStep('SET_PIN');
      } else {
        setAuthSuccess('Login successful! Redirecting...');
        window.location.replace(data.redirectTo || (selectedRole === 'worker' ? '/worker/dashboard' : '/customer/dashboard'));
      }
    } catch (err: unknown) {
      console.error(err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/invalid-verification-code') {
        setAuthError('Incorrect OTP code.');
      } else if (firebaseError.code === 'auth/code-expired') {
        setAuthError('OTP expired. Request a new one.');
      } else {
        setAuthError('Incorrect OTP code.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    if (pinSetup.length !== pinLength) {
      setAuthError(`Please enter exactly ${pinLength} digits`);
      setAuthLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinSetup })
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error || 'Failed to set PIN. Please try again.');
        setAuthLoading(false);
        return;
      }

      setAuthSuccess('PIN configured successfully! Redirecting...');
      window.location.replace(redirectToUrl || (selectedRole === 'worker' ? '/worker/dashboard' : '/customer/dashboard'));
    } catch (err) {
      console.error(err);
      setAuthError('Failed to set PIN. Please try again.');
      setAuthLoading(false);
    }
  };

  const mapServerErrors = (code: string) => {
    switch (code) {
      case 'INVALID_PHONE':
        setAuthError('Enter a valid 10-digit Indian mobile number');
        break;
      case 'ACCOUNT_BLOCKED':
        setAuthError('Account suspended. Contact support.');
        break;
      case 'INACTIVE_WORKER':
        setAuthError('Account inactive. Contact support.');
        break;
      case 'KYC_REJECTED':
        setAuthError('KYC status rejected. Support: help@volo.in');
        break;
      case 'UNAUTHORIZED_ROLE':
        setAuthError("You don't have access to this portal.");
        break;
      case 'FIREBASE_TOKEN_INVALID':
        setAuthError('Session expired. Please login again.');
        break;
      default:
        setAuthError('Authentication failed. Please retry.');
    }
  };

  const faqs = [
    { q: 'How do I book a service?', a: 'Select your preferred category, choose a standard hourly package or detail the issue, select a convenient time slot, verify with OTP, and confirm. A vetted expert will be assigned near you.' },
    { q: 'Are professionals verified?', a: 'Yes. Every service partner undergoes physical verification, PAN & Aadhaar validation, and trade skill certifications before they are authorized to take jobs.' },
    { q: 'How does payment work?', a: 'Payments are settled completely online cashlessly. You pay via cards, Net Banking, or UPI only after the job is completed and OTP validated.' },
    { q: 'Is service warranty available?', a: 'VOLO offers a comprehensive 30-day warranty on all repair services. If any issue arises from the completed work within 30 days, we fix it free of charge.' },
    { q: 'Can I track my technician?', a: 'Yes. Once assigned, you can view the technician\'s active location, chat instantly, and get real-time status updates via the client app portal.' }
  ];

  const testimonials = [
    {
      name: 'Rohan Sharma',
      role: 'Homeowner',
      rating: 5,
      text: 'Extremely professional AC servicing. The technician arrived within 30 minutes, wore protective gear, and cleaned up everything after the repair. Highly recommended!',
      location: 'Indiranagar, Bangalore'
    },
    {
      name: 'Priya Patel',
      role: 'Software Engineer',
      rating: 5,
      text: 'Booking a plumber on VOLO was incredibly easy. I chose a time slot, got matching rates, and the job started only after I shared the OTP. Very safe and convenient.',
      location: 'Koramangala, Bangalore'
    },
    {
      name: 'Vikram Singh',
      role: 'VOLO Service Partner',
      rating: 5,
      text: 'As a certified carpenter, VOLO has helped me double my monthly customer reach. Payouts are settled every Wednesday directly to my bank account. Excellent app interface.',
      location: 'Whitefield, Bangalore'
    }
  ];

  const filteredServices = searchQuery 
    ? PRESET_SERVICES.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : PRESET_SERVICES;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans select-none overflow-x-hidden scroll-smooth flex flex-col">
      
      {/* ================= HEADER / NAVBAR ================= */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-6 py-4 sm:px-12 flex justify-between items-center shrink-0">
        {/* Left: Branding */}
        <a href="#home" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpeg" alt="VOLO Logo" className="h-9 w-auto rounded-lg object-contain border border-slate-200/50 shadow-sm" />
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-black leading-none font-display">VOLO</span>
            <span className="text-[7px] font-black uppercase text-[#FF7A00] tracking-widest mt-0.5 leading-none">Your Home, Our Care</span>
          </div>
        </a>

        {/* Center: Menu links */}
        <div className="hidden lg:flex items-center gap-8">
          <a href="#home" className="text-black hover:text-[#FF7A00] transition-colors text-[11px] font-bold uppercase tracking-wider">Home</a>
          <a href="#services" className="text-black hover:text-[#FF7A00] transition-colors text-[11px] font-bold uppercase tracking-wider">Services</a>
          <a href="#how-it-works" className="text-black hover:text-[#FF7A00] transition-colors text-[11px] font-bold uppercase tracking-wider">How It Works</a>
          <a href="#become-partner" className="text-black hover:text-[#FF7A00] transition-colors text-[11px] font-bold uppercase tracking-wider">Become Partner</a>
          <a href="#why-choose" className="text-black hover:text-[#FF7A00] transition-colors text-[11px] font-bold uppercase tracking-wider">About</a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              setSelectedRole('customer');
              setAuthStep('PHONE');
              setAuthError(null);
              setAuthSuccess(null);
              setShowLoginModal(true);
            }}
            className="text-black hover:text-[#FF7A00] text-[11px] font-bold uppercase tracking-wider px-3 py-2 transition-colors cursor-pointer"
          >
            Login
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setSelectedRole('worker');
              setAuthStep('PHONE');
              setAuthError(null);
              setAuthSuccess(null);
              setShowLoginModal(true);
            }}
            className="hidden sm:inline-block border border-slate-200 text-black hover:border-[#FF7A00] hover:text-[#FF7A00] text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all hover-scale-btn cursor-pointer"
          >
            Join Partner
          </button>

          <a 
            href="#services" 
            className="bg-[#0A58CA] hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/10 hover-scale-btn inline-block cursor-pointer"
          >
            Book Service
          </a>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="relative min-h-[90vh] bg-gradient-to-br from-white via-slate-50 to-orange-50/20 py-16 sm:py-24 px-6 sm:px-12 flex items-center overflow-hidden">
        {/* Glow Accent Circles */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#FF7A00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#5CBF2A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left Text Column */}
          <div className="space-y-8 text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-100/60 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase text-[#FF7A00] tracking-wider animate-pulse-slow">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7A00] fill-[#FF7A00]" />
              Premium On-Demand Marketplace
            </span>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 leading-tight tracking-tight font-display">
              Trusted Home Services <br />
              <span className="bg-gradient-to-r from-[#FF7A00] via-[#0A58CA] to-[#5CBF2A] bg-clip-text text-transparent">
                At Your Doorstep
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Book vetted, certified electricians, plumbers, AC technicians, carpenters, painters, and cleaning experts within minutes. Premium home care backed by standard pricing.
            </p>

            {/* Quick search input */}
            <div className="relative max-w-md flex items-center bg-white border border-slate-200 focus-within:border-[#0A58CA] focus-within:ring-4 focus-within:ring-blue-100 rounded-2xl p-1.5 shadow-md shadow-slate-200/20 transition-all">
              <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Search for electrician, plumber, AC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs outline-none text-slate-800 font-semibold"
              />
              <a 
                href="#services"
                className="bg-[#FF7A00] hover:bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Search
              </a>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <a 
                href="#services" 
                className="px-6 py-3.5 rounded-2xl bg-[#0A58CA] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 hover-scale-btn cursor-pointer inline-flex items-center gap-2"
              >
                Book Now
                <ChevronRight className="h-4 w-4" />
              </a>
              <a 
                href="#services" 
                className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-black text-xs uppercase tracking-wider transition-all shadow-sm hover-scale-btn cursor-pointer"
              >
                Explore Services
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-slate-600 font-bold text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#5CBF2A]" />
                <span>Verified Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#5CBF2A]" />
                <span>Live GPS Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#5CBF2A]" />
                <span>Secure Cashless Pay</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#5CBF2A]" />
                <span>Same Day Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right SVG Graphic Column */}
          <div className="relative flex justify-center items-center lg:h-[500px]">
            {/* SVG Graphic with Floating animations */}
            <svg viewBox="0 0 500 500" className="w-full max-w-[450px] drop-shadow-xl h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Background circular graphic */}
              <circle cx="250" cy="250" r="210" fill="none" stroke="url(#logoGrad)" strokeWidth="4" strokeDasharray="10 6" className="animate-spin-slow origin-center" />
              <circle cx="250" cy="250" r="190" fill="url(#bgRadial)" />

              {/* Central Premium House Structure */}
              <path d="M250,90 L400,210 L400,380 L100,380 L100,210 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
              {/* Split Roof */}
              <path d="M250,90 L395,206" stroke="#FF7A00" strokeWidth="16" strokeLinecap="round" />
              <path d="M250,90 L105,206" stroke="#5CBF2A" strokeWidth="16" strokeLinecap="round" />

              {/* Orange and Green Pillars inside house */}
              <rect x="140" y="240" width="80" height="110" rx="8" fill="#FF7A00" opacity="0.85" />
              <rect x="280" y="240" width="80" height="110" rx="8" fill="#5CBF2A" opacity="0.85" />
              {/* Central Blue Window */}
              <rect x="220" y="160" width="60" height="60" rx="6" fill="#0A58CA" opacity="0.85" />
              <rect x="230" y="170" width="18" height="18" fill="#ffffff" />
              <rect x="252" y="170" width="18" height="18" fill="#ffffff" />
              <rect x="230" y="192" width="18" height="18" fill="#ffffff" />
              <rect x="252" y="192" width="18" height="18" fill="#ffffff" />

              {/* Floating Workers bubbles */}
              {/* Electrician Bubble */}
              <g className="animate-float" transform="translate(60, 100)">
                <circle cx="45" cy="45" r="40" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <circle cx="45" cy="45" r="34" fill="#fff7ed" />
                <path d="M45,25 C37,25 32,30 32,38 C32,46 45,58 45,58 C45,58 58,46 58,38 C58,30 53,25 45,25 Z" fill="#FF7A00" />
                <path d="M38,36 L43,41 L52,32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M45,15 L48,22 L56,24 L50,29 L52,36 L45,32 L38,36 L40,29 L34,24 L42,22 Z" fill="#eab308" transform="translate(18, 5) scale(0.6)" />
              </g>

              {/* Plumber Bubble */}
              <g className="animate-float-delayed" transform="translate(370, 150)">
                <circle cx="45" cy="45" r="40" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <circle cx="45" cy="45" r="34" fill="#eff6ff" />
                <path d="M45,30 C45,30 35,42 35,46 C35,51.5 39.5,56 45,56 C50.5,56 55,51.5 55,46 C55,42 45,30 45,30 Z" fill="#0A58CA" />
                <circle cx="45" cy="48" r="4" fill="#ffffff" />
              </g>

              {/* Carpenter Bubble */}
              <g className="animate-float" transform="translate(320, 340)">
                <circle cx="45" cy="45" r="40" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <circle cx="45" cy="45" r="34" fill="#f0fdf4" />
                <path d="M30,35 H60 V55 H30 Z" fill="#5CBF2A" />
                <path d="M45,25 L35,35 H55 Z" fill="#166534" />
                <circle cx="45" cy="45" r="3" fill="#ffffff" />
              </g>

              {/* Left safety checkmark badge bubble */}
              <g className="animate-float-delayed" transform="translate(40, 300)">
                <circle cx="45" cy="45" r="40" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <circle cx="45" cy="45" r="34" fill="#ecfdf5" />
                <path d="M45,26 C34.5,26 34,35 34,35 C34,45.5 45,54 45,54 C45,54 56,45.5 56,35 C56,35 55.5,26 45,26 Z" fill="#10b981" />
                <path d="M40,39 L43,42 L50,35" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </g>

              {/* Definitions */}
              <defs>
                <radialGradient id="bgRadial" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </radialGradient>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A00" />
                  <stop offset="50%" stopColor="#0A58CA" />
                  <stop offset="100%" stopColor="#5CBF2A" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Tag */}
            <div className="absolute bottom-10 left-10 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 hover-scale animate-float-delayed">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#FF7A00]" />
              </div>
              <div>
                <h6 className="font-extrabold text-xs text-slate-800 leading-none">1,000+ Vetted Partners</h6>
                <span className="text-[9px] text-[#5CBF2A] font-bold">Online & Nearest to you</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <section id="services" className="py-20 px-6 sm:px-12 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Section Headings */}
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#FF7A00]/5 border border-[#FF7A00]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#FF7A00] tracking-wider">
              On-Demand Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Most Booked Services</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select standard packages or detail your custom repair needs. Standard hourly billing, guaranteed satisfaction.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredServices.map((s) => {
              const Icon = s.icon;
              return (
                <div 
                  key={s.name}
                  className="bg-slate-50 hover:bg-white border border-slate-200/60 rounded-3xl p-6 hover:border-orange-200 hover:shadow-xl transition-all hover-scale flex flex-col justify-between group h-full"
                >
                  <div className="space-y-4">
                    {/* Top: Icon & Badge */}
                    <div className="flex justify-between items-start">
                      <div className={`h-12 w-12 rounded-2xl ${s.color} border flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-400 bg-white border border-slate-200/80 px-2.5 py-1 rounded-full">
                        {s.badge}
                      </span>
                    </div>

                    {/* Middle: Mock Image & Text */}
                    <div className="space-y-2">
                      <div className="h-32 w-full rounded-2xl bg-slate-200/60 border border-slate-200/50 overflow-hidden relative select-none">
                        {/* CSS-drawn placeholder illustrating the service trade type */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center opacity-75 group-hover:opacity-90 transition-opacity">
                          <Icon className="h-14 w-14 text-slate-300 group-hover:text-[#FF7A00] transition-colors" />
                        </div>
                        {/* Bottom price tag bubble */}
                        <div className="absolute bottom-3 right-3 bg-white/95 px-3 py-1.5 rounded-xl text-[10px] font-black text-[#FF7A00] shadow-sm border border-slate-100">
                          Starts {s.price}
                        </div>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-800 font-display group-hover:text-[#0A58CA] transition-colors">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>

                  {/* Bottom: Book CTA */}
                  <div className="pt-5 mt-5 border-t border-slate-200/50">
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedRole('customer');
                        setAuthStep('PHONE');
                        setAuthError(null);
                        setAuthSuccess(null);
                        setShowLoginModal(true);
                      }}
                      className="w-full bg-white hover:bg-[#FF7A00] border border-slate-200 hover:border-transparent text-slate-700 hover:text-white font-extrabold text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all shadow-sm hover-scale-btn cursor-pointer inline-flex justify-center items-center gap-1.5"
                    >
                      Book Now
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS SECTION ================= */}
      <section id="how-it-works" className="py-20 px-6 sm:px-12 bg-slate-50 border-t border-b border-slate-200/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#5CBF2A]/5 border border-[#5CBF2A]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#5CBF2A] tracking-wider">
              Booking Guide
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">How VOLO Works</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Clean, structured 4-step dispatch timeline for standard home diagnostics and immediate assignments.
            </p>
          </div>

          {/* Timeline Process Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-4 text-center sm:text-left relative bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm hover:border-[#FF7A00] transition-colors hover-scale">
              <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#FF7A00] font-black text-xs flex items-center justify-center">1</div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Choose Service</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Browse electrical, plumbing, carpentry, or sanitization lists and select pre-priced hourly diagnostic packages.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 text-center sm:text-left relative bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm hover:border-[#0A58CA] transition-colors hover-scale">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#0A58CA] font-black text-xs flex items-center justify-center">2</div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Select Time Slot</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Schedule technician arrival immediately within 45 minutes on-demand, or book slots later during the week.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 text-center sm:text-left relative bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm hover:border-[#5CBF2A] transition-colors hover-scale">
              <div className="h-10 w-10 rounded-xl bg-green-100 text-[#5CBF2A] font-black text-xs flex items-center justify-center">3</div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Vetted Expert Assigned</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                The closest certified technician is matched. View name, qualifications, background review rating, and location tracking.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-4 text-center sm:text-left relative bg-white border border-slate-200/60 p-6 rounded-3xl shadow-sm hover:border-rose-200 transition-colors hover-scale">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 font-black text-xs flex items-center justify-center">4</div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Service Completed</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Technician begins and closes service using client-received OTP codes. Check results, pay cashlessly via secure gateway.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE VOLO ================= */}
      <section id="why-choose" className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#0A58CA]/5 border border-[#0A58CA]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#0A58CA] tracking-wider">
              Safety & Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Why Choose VOLO</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              India&apos;s securest platform for verified household repairs, physical trades validations, and fair pricing models.
            </p>
          </div>

          {/* 8 Feature cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-[#FF7A00] transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF7A00]">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Verified Professionals</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Identity audit checks via Aadhaar, PAN, and local physical verification.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-[#0A58CA] transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#0A58CA]">
                <MapPin className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Real-Time GPS Tracking</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Dispatch map markers showing exactly when your technician will arrive at the door.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-[#5CBF2A] transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center text-[#5CBF2A]">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Secure OTP Start/End</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Security code confirmations prevent unauthorized starting or billing errors.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-amber-400 transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Transparent Fixed Pricing</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">No surprises on final invoices. Upfront standardized hourly diagnostics rates.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-purple-400 transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Mail className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Instant Helper Support</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">24/7 client dispatch helplines to handle any queries during ongoing jobs.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-rose-400 transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">30-Day Service Warranty</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Complete satisfaction guarantee on AC filters, pipes, locks, and switch fixes.</p>
            </div>

            {/* Feature 7 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-teal-400 transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">Trade Skill Certified</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Service partners pass physical testing and tool handling check reviews before onboarding.</p>
            </div>

            {/* Feature 8 */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl shadow-sm space-y-3 hover:border-emerald-400 transition-colors hover-scale">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-xs text-slate-800 font-display">45-Minute Rapid Response</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">Vast dispatch network ensures a technician reaches your slot faster.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE TRACKING SECTION ================= */}
      <section id="live-tracking" className="py-20 px-6 sm:px-12 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left info column */}
          <div className="space-y-6 text-left max-w-lg">
            <span className="inline-flex items-center gap-1.5 bg-[#0A58CA]/5 border border-[#0A58CA]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#0A58CA] tracking-wider">
              Platform Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Live Job Tracking Dashboard</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              No more guessing when your technician will arrive or what the final diagnostic bill contains. The VOLO app dashboard gives you end-to-end status visibility:
            </p>
            <ul className="space-y-3 text-slate-700 font-semibold text-xs">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#5CBF2A]" />
                <span>Real-time technician location updates on a GPS map.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#5CBF2A]" />
                <span>Live ETA countdown and SMS dispatch notifications.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#5CBF2A]" />
                <span>Interactive OTP confirmations block unauthorized actions.</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-[#5CBF2A]" />
                <span>Downloadable digital invoices sent directly to your email.</span>
              </li>
            </ul>
          </div>

          {/* Right visual UI mockup column */}
          <div className="flex justify-center items-center">
            {/* Dashboard UI mock container */}
            <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden font-mono select-none">
              {/* Header mockup */}
              <div className="bg-[#0A58CA] p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px]">RK</div>
                  <div>
                    <h6 className="font-extrabold text-[10px] leading-none">Ramesh Kumar</h6>
                    <span className="text-[7px] text-blue-200">AC Repair Technician</span>
                  </div>
                </div>
                <div className="bg-[#5CBF2A] px-2 py-1 rounded text-[8px] font-black uppercase text-white animate-pulse-slow">En Route</div>
              </div>

              {/* Map visual mock */}
              <div className="h-44 bg-slate-100 relative overflow-hidden border-b border-slate-200">
                {/* SVG path lines representing a map grid */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-20,60 L200,60 L200,200" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <path d="M120,-20 L120,130 L450,130" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <path d="M280,30 L280,180" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle cx="120" cy="100" r="8" fill="#0A58CA" className="animate-ping" opacity="0.3" />
                  <circle cx="120" cy="100" r="5" fill="#0A58CA" />
                  <circle cx="280" cy="80" r="8" fill="#FF7A00" className="animate-ping" opacity="0.3" />
                  <circle cx="280" cy="80" r="6" fill="#FF7A00" />
                </svg>
                {/* Map Floating Badges */}
                <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg text-[8px] font-extrabold text-slate-800 shadow-sm border border-slate-100">
                  ETA: 12 Minutes
                </div>
                <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 rounded-lg text-[8px] font-extrabold text-[#FF7A00] shadow-sm border border-slate-100">
                  Dist: 1.4 km
                </div>
              </div>

              {/* Status details mock */}
              <div className="p-4 space-y-4 text-left font-sans text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-black">
                    <span>Active Booking ID</span>
                    <span>#VOLO-89023</span>
                  </div>
                  <h6 className="font-extrabold text-slate-800 text-xs">Filter Deep Cleaning Package</h6>
                </div>

                {/* Checklist steps */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[#5CBF2A]">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span className="font-bold text-[10px]">Booking Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5CBF2A]">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span className="font-bold text-[10px]">Technician Ramesh Dispatched</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4.5 w-4.5 shrink-0 text-slate-300" />
                    <span className="font-semibold text-[10px]">Job Verification OTP (Shared on arrival)</span>
                  </div>
                </div>

                {/* Price breakdown mock */}
                <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center border border-slate-200/50 text-[10px]">
                  <span className="font-bold text-slate-500">Standard Estimated Billing:</span>
                  <span className="font-black text-[#FF7A00]">₹349 (Cashless Gateway)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BECOME A PARTNER SECTION ================= */}
      <section id="become-partner" className="py-20 px-6 sm:px-12 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#FF7A00] to-orange-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 text-left">
              <span className="inline-flex items-center bg-white/20 border border-white/10 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-white tracking-wider">
                Partnership
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-display">Earn More With VOLO</h2>
              <p className="text-xs sm:text-sm text-orange-50 leading-relaxed">
                Join our certified network of professionals. Get regular local assignments, flexible working schedules, transparent commissions, and settlements deposited straight to your bank account weekly.
              </p>

              <button 
                type="button"
                onClick={() => {
                  setSelectedRole('worker');
                  setAuthStep('PHONE');
                  setAuthError(null);
                  setAuthSuccess(null);
                  setShowLoginModal(true);
                }}
                className="bg-white hover:bg-orange-50 text-[#FF7A00] font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl transition-all shadow-md hover-scale-btn cursor-pointer inline-flex items-center gap-1.5"
              >
                Join As Professional
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Benefits checks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-bold text-xs sm:text-sm">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#5CBF2A]" />
                <span>Flexible working hours</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#5CBF2A]" />
                <span>Weekly payouts</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#5CBF2A]" />
                <span>Regular customer flows</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#5CBF2A]" />
                <span>Skill training guides</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATISTICS SECTION ================= */}
      <section className="py-16 px-6 sm:px-12 bg-slate-900 text-white select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-5xl font-black text-[#FF7A00] font-display">10,000+</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-widest">Services Completed</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-5xl font-black text-[#5CBF2A] font-display">5,000+</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-widest">Happy Customers</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-5xl font-black text-sky-400 font-display">1,000+</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-widest">Professionals</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-5xl font-black text-amber-450 font-display flex justify-center items-center gap-1">4.9<Star className="h-6 w-6 text-amber-400 fill-amber-400" /></h3>
            <p className="text-[10px] sm:text-xs text-slate-400 uppercase font-black tracking-widest">Average Rating</p>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS SECTION ================= */}
      <section id="testimonials" className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#5CBF2A]/5 border border-[#5CBF2A]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#5CBF2A] tracking-wider">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Loved By Thousands</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Read reviews from homeowners and certified technicians who use the VOLO platform daily.
            </p>
          </div>

          {/* Testimonial slider / carousel mock */}
          <div className="relative max-w-2xl mx-auto">
            {/* Review Card */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-6 flex flex-col justify-between min-h-[200px] hover:border-[#0A58CA] transition-colors">
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-amber-500" />
                    ))}
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400">Verified User</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
                  &ldquo;{testimonials[currentTestimonial].text}&rdquo;
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-[10px]">
                    {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h6 className="font-extrabold text-slate-800 leading-none">{testimonials[currentTestimonial].name}</h6>
                    <span className="text-[8px] text-slate-400">{testimonials[currentTestimonial].role}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-450">{testimonials[currentTestimonial].location}</span>
              </div>
            </div>

            {/* Slider controls */}
            <div className="flex justify-center items-center gap-4 pt-6 select-none">
              <button 
                type="button"
                onClick={() => setCurrentTestimonial(prev => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:border-[#0A58CA] hover:text-[#0A58CA] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`h-2.5 w-2.5 rounded-full transition-all cursor-pointer ${currentTestimonial === idx ? 'bg-[#FF7A00] w-6' : 'bg-slate-300'}`}
                />
              ))}
              <button 
                type="button"
                onClick={() => setCurrentTestimonial(prev => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:border-[#0A58CA] hover:text-[#0A58CA] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= APP DOWNLOAD SECTION ================= */}
      <section className="py-20 px-6 sm:px-12 bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Visual App Mockup */}
          <div className="flex justify-center items-center">
            {/* Phone SVG frame mockup */}
            <svg viewBox="0 0 320 600" className="w-full max-w-[280px] drop-shadow-xl h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Outer Phone Shell */}
              <rect x="10" y="10" width="300" height="580" rx="36" fill="#1e293b" />
              <rect x="16" y="16" width="288" height="568" rx="30" fill="#f8fafc" />
              {/* Camera Notch */}
              <rect x="110" y="22" width="100" height="18" rx="9" fill="#1e293b" />

              {/* Inside App Mock screen contents */}
              {/* Navbar mock */}
              <rect x="24" y="52" width="272" height="40" rx="6" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.03))" />
              <circle cx="40" cy="72" r="10" fill="#FF7A00" />
              <rect x="58" y="66" width="100" height="6" rx="3" fill="#e2e8f0" />
              <rect x="58" y="74" width="60" height="4" rx="2" fill="#cbd5e1" />

              {/* Category Bubbles mock */}
              <rect x="24" y="108" width="56" height="56" rx="12" fill="#eff6ff" />
              <circle cx="52" cy="136" r="12" fill="#0A58CA" />
              <rect x="24" y="174" width="56" height="6" rx="3" fill="#94a3b8" />

              <rect x="94" y="108" width="56" height="56" rx="12" fill="#fff7ed" />
              <circle cx="122" cy="136" r="12" fill="#FF7A00" />
              <rect x="94" y="174" width="56" height="6" rx="3" fill="#94a3b8" />

              <rect x="164" y="108" width="56" height="56" rx="12" fill="#f0fdf4" />
              <circle cx="192" cy="136" r="12" fill="#5CBF2A" />
              <rect x="164" y="174" width="56" height="6" rx="3" fill="#94a3b8" />

              <rect x="234" y="108" width="42" height="56" rx="12" fill="#fcfcfc" />

              {/* Main Promo card banner mock */}
              <rect x="24" y="196" width="272" height="120" rx="16" fill="url(#phoneCardGrad)" />
              <rect x="40" y="216" width="120" height="12" rx="4" fill="#ffffff" />
              <rect x="40" y="234" width="180" height="8" rx="3" fill="#ffedd5" />
              <rect x="40" y="246" width="160" height="8" rx="3" fill="#ffedd5" />
              {/* Button in promo */}
              <rect x="40" y="270" width="80" height="24" rx="12" fill="#ffffff" />
              <rect x="55" y="279" width="50" height="6" rx="3" fill="#FF7A00" />

              {/* Tracking card active order mock */}
              <rect x="24" y="336" width="272" height="110" rx="16" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))" />
              <circle cx="48" cy="372" r="14" fill="#f0fdf4" />
              <rect x="74" y="362" width="120" height="10" rx="3" fill="#0f172a" />
              <rect x="74" y="378" width="80" height="6" rx="2" fill="#22c55e" />
              {/* progress check */}
              <line x1="48" y1="400" x2="272" y2="400" stroke="#f1f5f9" strokeWidth="2" />
              <circle cx="80" cy="412" r="4" fill="#5CBF2A" />
              <circle cx="160" cy="412" r="4" fill="#e2e8f0" />
              <circle cx="240" cy="412" r="4" fill="#e2e8f0" />

              {/* Bottom Nav Bar mock */}
              <rect x="16" y="528" width="288" height="56" rx="0" fill="#ffffff" border-t="1px solid #e2e8f0" />
              <circle cx="60" cy="554" r="8" fill="#FF7A00" />
              <circle cx="120" cy="554" r="8" fill="#cbd5e1" />
              <circle cx="180" cy="554" r="8" fill="#cbd5e1" />
              <circle cx="240" cy="554" r="8" fill="#cbd5e1" />

              <defs>
                <linearGradient id="phoneCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF7A00" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Right Download text details column */}
          <div className="space-y-8 text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-[#5CBF2A]/5 border border-[#5CBF2A]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#5CBF2A] tracking-wider">
              Mobile App
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">VOLO Mobile App</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Book services on the go, track your technician in real-time, store payment histories, view digital invoices, and access 24/7 help desk support instantly. Download the VOLO App on iOS and Android today.
            </p>

            {/* App Store / Google Play Buttons */}
            <div className="flex flex-wrap gap-4 select-none">
              {/* Google Play Button */}
              <a 
                href="#home"
                className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-800 transition-colors shadow-md cursor-pointer"
              >
                <Play className="h-6 w-6 text-[#5CBF2A] fill-[#5CBF2A]" />
                <div className="text-left leading-none">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Get it on</span>
                  <h6 className="font-extrabold text-xs tracking-tight mt-0.5">Google Play</h6>
                </div>
              </a>

              {/* App Store Button */}
              <a 
                href="#home"
                className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-800 transition-colors shadow-md cursor-pointer"
              >
                <Apple className="h-6 w-6 text-white fill-white" />
                <div className="text-left leading-none">
                  <span className="text-[9px] uppercase text-slate-400 font-bold">Download on the</span>
                  <h6 className="font-extrabold text-xs tracking-tight mt-0.5">App Store</h6>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-20 px-6 sm:px-12 bg-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 bg-[#FF7A00]/5 border border-[#FF7A00]/10 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase text-[#FF7A00] tracking-wider">
              Support Center
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Find instant answers to common booking, verification, safety, and cashless billing queries.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:border-[#0A58CA] transition-colors">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 hover:text-slate-950 text-left cursor-pointer transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-[11px] sm:text-xs text-slate-500 leading-relaxed border-t border-slate-200/40 pt-3.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer id="footer" className="bg-slate-900 text-slate-400 py-16 px-6 sm:px-12 border-t border-slate-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* branding column */}
            <div className="col-span-2 space-y-4">
              <a href="#home" className="flex items-center gap-2.5 select-none hover:opacity-90 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/logo.jpeg" alt="VOLO Logo" className="h-8 w-auto rounded-lg object-contain border border-slate-800/80 shadow-md" />
                <span className="font-extrabold text-lg tracking-wider text-white font-display">VOLO</span>
              </a>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                Premium vetted home care services delivered directly to your doorstep. Standardized hourly diagnostic pricing, GPS location tracking, and cashless verify OTP validation.
              </p>
              {/* social links */}
              <div className="flex gap-4 text-xs font-bold text-slate-500 select-none">
                <a href="#footer" className="hover:text-white transition-colors">Facebook</a>
                <a href="#footer" className="hover:text-white transition-colors">Twitter</a>
                <a href="#footer" className="hover:text-white transition-colors">Instagram</a>
                <a href="#footer" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>

            {/* popular services column */}
            <div className="space-y-4 text-left">
              <h5 className="font-black text-white text-[10px] uppercase tracking-wider">Services</h5>
              <ul className="space-y-2 text-[10px] font-bold">
                <li><a href="#services" className="hover:text-[#FF7A00] transition-colors">Electrical Repairs</a></li>
                <li><a href="#services" className="hover:text-[#FF7A00] transition-colors">Plumbing Fittings</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-4 text-left">
              <h5 className="font-black text-white text-[10px] uppercase tracking-wider">Company</h5>
              <ul className="space-y-2 text-[10px] font-bold">
                <li><a href="#why-choose" className="hover:text-[#FF7A00] transition-colors">About Us</a></li>
                <li><a href="#become-partner" className="hover:text-[#FF7A00] transition-colors">Become a Partner</a></li>
                <li><a href="#home" className="hover:text-[#FF7A00] transition-colors">Press & Media</a></li>
                <li><a href="#home" className="hover:text-[#FF7A00] transition-colors">Careers</a></li>
              </ul>
            </div>

            {/* Support column */}
            <div className="space-y-4 text-left col-span-2 md:col-span-1">
              <h5 className="font-black text-white text-[10px] uppercase tracking-wider">Support & Help</h5>
              <ul className="space-y-2.5 text-[10px] font-bold">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#FF7A00]" />
                  <span>help@volo.in</span>
                </li>
                <li className="flex items-center gap-2">
                  <PhoneCall className="h-3.5 w-3.5 text-[#FF7A00]" />
                  <span>+91 80 4900 2345</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#FF7A00]" />
                  <span>Bangalore, KA, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright row */}
          <div className="pt-8 border-t border-slate-800 text-[9px] text-slate-600 font-bold select-none flex flex-col sm:flex-row justify-between items-center gap-4">
            <span>© {new Date().getFullYear()} VOLO On-Demand Services. All Rights Reserved.</span>
            <div className="flex gap-4">
              <a href="#footer" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#footer" className="hover:text-slate-400 transition-colors">Terms of Use</a>
              <a href="#footer" className="hover:text-slate-400 transition-colors">Trust & Safety Guidelines</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= LOGIN & REGISTRATION MODAL ================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 relative select-none animate-fade-in-up">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Branding Header */}
            <div className="flex flex-col items-center text-center space-y-2 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.jpeg" alt="VOLO Logo" className="h-14 w-auto object-contain rounded-2xl shadow-sm border border-slate-100" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
                {authStep === 'SET_PIN' ? 'Secure Your Account' : 'Access Account Console'}
              </h2>
              <p className="text-xs text-slate-400">
                {authStep === 'SET_PIN' ? 'Create a secure PIN for quick access' : 'Select portal role and verify mobile OTP'}
              </p>
            </div>

            {/* Tab Selector */}
            {authStep !== 'SET_PIN' && (
              <div className="flex border border-slate-200 p-1 bg-slate-100 rounded-2xl mt-4 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('customer');
                    setAuthStep('PHONE');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                    selectedRole === 'customer'
                      ? 'bg-white text-[#FF7A00] shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Customer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('worker');
                    setAuthStep('PHONE');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex justify-center items-center gap-1.5 ${
                    selectedRole === 'worker'
                      ? 'bg-white text-[#FF7A00] shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Partner
                </button>
              </div>
            )}

            {/* Error alerts logs */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-650 rounded-2xl text-[10px] font-bold text-center flex items-center justify-center gap-2 mt-4">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-650 rounded-2xl text-[10px] font-bold text-center flex items-center justify-center gap-2 mt-4">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Form layout */}
            {authStep === 'PHONE' && (
              <form onSubmit={handleSendOtp} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-[#FF7A00]" />
                    Mobile Phone Number
                  </label>
                  <div className="flex rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#0A58CA] focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                    <span className="flex items-center pl-4 text-slate-400 font-bold text-xs">+91</span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-3 py-3 text-xs outline-none text-slate-800 placeholder-slate-400 font-semibold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || phoneNumber.length < 10}
                  className="w-full bg-[#FF7A00] hover:bg-orange-600 disabled:bg-orange-400 text-white font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5 select-none cursor-pointer shadow-sm shadow-orange-500/10 hover-scale-btn"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send SMS OTP Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {authStep === 'OTP' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-455 tracking-wider flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-[#FF7A00]" />
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#FF7A00] focus:ring-4 focus:ring-orange-100 text-center tracking-[0.6em] font-mono text-sm rounded-2xl px-3 py-3 outline-none transition-colors font-extrabold text-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || otpValue.length !== 6}
                  className="w-full bg-[#FF7A00] hover:bg-orange-600 disabled:bg-orange-400 text-white font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5 select-none cursor-pointer shadow-sm hover-scale-btn"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify Code & Login'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('PHONE');
                    setOtpValue('');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl py-2.5 text-xs transition-all text-center select-none cursor-pointer border border-slate-200"
                >
                  Change Phone Number
                </button>
              </form>
            )}

            {authStep === 'SET_PIN' && (
              <form onSubmit={handleSetPin} className="space-y-5 mt-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-extrabold uppercase text-slate-455 tracking-wider flex items-center gap-1.5 justify-center">
                    <Lock className="h-4 w-4 text-[#FF7A00]" />
                    Create a Secure Login PIN
                  </label>

                  {/* PIN length selector */}
                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setPinLength(4); setPinSetup(p => p.slice(0, 4)); }}
                      className={`flex-1 max-w-[120px] py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                        pinLength === 4
                          ? 'bg-[#FF7A00] border-[#FF7A00] text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#FF7A00] hover:text-[#FF7A00]'
                      }`}
                    >
                      4 Digit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPinLength(6)}
                      className={`flex-1 max-w-[120px] py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                        pinLength === 6
                          ? 'bg-[#FF7A00] border-[#FF7A00] text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#FF7A00] hover:text-[#FF7A00]'
                      }`}
                    >
                      6 Digit
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-550 text-center leading-relaxed">
                    You will use this {pinLength}-digit PIN to log in next time on recognized devices.
                  </p>
                  
                  <div className="relative flex justify-center py-2">
                    <input
                      ref={pinSetupInputRef}
                      type="text"
                      pattern="\d*"
                      inputMode="numeric"
                      maxLength={pinLength}
                      value={pinSetup}
                      onChange={(e) => setPinSetup(e.target.value.replace(/\D/g, '').slice(0, pinLength))}
                      onFocus={() => setIsPinSetupFocused(true)}
                      onBlur={() => setIsPinSetupFocused(false)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                      autoFocus
                    />
                    <div className="flex gap-2 justify-center">
                      {Array.from({ length: pinLength }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-11 h-13 rounded-2xl border flex items-center justify-center text-2xl font-bold transition-all duration-200
                            ${
                              isPinSetupFocused && pinSetup.length === idx
                                ? 'border-[#FF7A00] ring-4 ring-[#FF7A00]/10 scale-105 bg-slate-50 shadow-md'
                                : pinSetup[idx]
                                ? 'border-[#FF7A00]/80 bg-slate-100/50 text-[#FF7A00] font-sans'
                                : 'border-slate-200 bg-slate-50/60 text-slate-400'
                            }`}
                        >
                          {pinSetup[idx] ? '•' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || pinSetup.length !== pinLength}
                  className="w-full bg-[#FF7A00] hover:bg-orange-600 disabled:bg-orange-400 text-white font-extrabold rounded-2xl py-3.5 text-xs uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5 select-none cursor-pointer shadow-sm hover-scale-btn"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Set ${pinLength}-Digit PIN & Continue`
                  )}
                </button>
              </form>
            )}


          </div>
        </div>
      )}

      {/* Permanent invisible container for reCAPTCHA validation */}
      <div id="recaptcha-container-home-light" className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none"></div>

    </div>
  );
}
