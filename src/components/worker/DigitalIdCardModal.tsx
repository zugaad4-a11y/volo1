'use client';
 
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Printer, X, Loader2, Calendar, Shield } from 'lucide-react';
import QRCode from 'qrcode';
 
interface DigitalIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: {
    id: string;
    full_name: string;
    phone: string;
    dob?: string | null;
    worker_id_code?: string | null;
    skills?: string[];
    service_categories?: string[];
  } | null;
  photoUrl: string | null;
}
 
export default function DigitalIdCardModal({ isOpen, onClose, worker, photoUrl }: DigitalIdCardModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
 
  useEffect(() => {
    if (isOpen && worker) {
      const verificationUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/verify/worker/${worker.worker_id_code || worker.id}`
        : `/verify/worker/${worker.worker_id_code || worker.id}`;
 
      QRCode.toDataURL(verificationUrl, {
        margin: 1,
        width: 300,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#070B14',
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('QR code generation failed:', err);
      });
    }
  }, [isOpen, worker]);
 
  if (!isOpen || !worker) return null;
 
  const profession = worker.service_categories && worker.service_categories.length > 0
    ? worker.service_categories[0]
    : worker.skills && worker.skills.length > 0
      ? worker.skills[0]
      : 'Field Partner';
 
  const joinDate = '13/06/2026';
 
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:bg-white print:p-0 animate-in fade-in duration-200">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-id-card-area, #printable-id-card-area * {
            visibility: visible;
          }
          #printable-id-card-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) scale(1.1);
            width: 100% !important;
            max-width: 700px !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            gap: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          #printable-id-card-area > div {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />
      
      {/* Mobile Toggle Carousel Tabs (Pills) */}
      <div className="flex md:hidden bg-slate-900/80 border border-white/[0.06] rounded-full p-1 mb-4 z-20 no-print select-none">
        <button
          type="button"
          onClick={() => setActiveSide('front')}
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSide === 'front'
              ? 'bg-[#FF8A00] text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Front Side
        </button>
        <button
          type="button"
          onClick={() => setActiveSide('back')}
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSide === 'back'
              ? 'bg-[#FF8A00] text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Back Side
        </button>
      </div>

      {/* Cards Area Wrapper */}
      <div 
        id="printable-id-card-area" 
        className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-[720px] mx-auto py-4"
      >
        
        {/* ==================== FRONT SIDE BADGE ==================== */}
        <div className={`w-full max-w-[320px] md:flex md:flex-col md:items-center ${activeSide === 'front' ? 'flex flex-col items-center' : 'hidden md:flex'}`}>
          
          {/* Lanyard & Strap Visuals */}
          <div className="flex flex-col items-center mb-[-24px] relative z-20 no-print">
            <div className="w-6 h-28 bg-gradient-to-b from-[#FF8A00] to-[#E66E00] rounded-t-lg shadow-lg relative">
              <div className="absolute inset-y-0 left-1.5 w-0.5 bg-black/15"></div>
              <div className="absolute inset-y-0 right-1.5 w-0.5 bg-black/15"></div>
            </div>
            <div className="w-8 h-8 rounded-full border-[3px] border-slate-700 bg-slate-800 flex items-center justify-center -mt-1 shadow-md">
              <div className="w-3 h-5 rounded-full border-2 border-slate-500 bg-transparent -mt-2"></div>
            </div>
            <div className="w-2 h-6 bg-gradient-to-b from-slate-400 to-slate-500 shadow -mt-1 rounded-sm relative">
              <div className="absolute bottom-0 left-[-4px] w-4 h-2.5 rounded-full border-2 border-slate-400 bg-slate-500"></div>
            </div>
          </div>
 
          {/* Badge Container */}
          <div className="w-full h-[490px] bg-[#111827] border border-white/[0.08] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 z-10">
            {/* Background design accents */}
            <div className="absolute top-0 -left-10 w-36 h-36 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 -right-10 w-36 h-36 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Left and Right Orange side curves */}
            <div className="absolute top-24 left-0 w-1 h-48 bg-[#FF8A00] rounded-r-lg shadow-[0_0_12px_rgba(255,138,0,0.4)] pointer-events-none" />
            <div className="absolute top-24 right-0 w-1 h-48 bg-[#FF8A00] rounded-l-lg shadow-[0_0_12px_rgba(255,138,0,0.4)] pointer-events-none" />
 
            {/* Badge Holder Slot at top */}
            <div className="w-12 h-2.5 bg-[#070B14] rounded-full mx-auto -mt-2.5 mb-2 relative z-10" />
 
            {/* Front Header */}
            <div className="flex flex-col items-center text-center mt-1 select-none">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo.jpeg" 
                  alt="VOLO Logo" 
                  className="h-7 w-7 rounded-lg object-contain border border-white/10" 
                />
                <span className="font-display font-black text-sm tracking-tight text-white leading-none">
                  VOLO NETWORK
                </span>
              </div>
              <span className="text-[8px] font-black text-[#FF8A00] tracking-widest uppercase mt-1">
                Field Partner
              </span>
            </div>
 
            {/* Avatar Photo */}
            <div className="relative mt-4">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-[4px] border-[#111827] ring-4 ring-[#FF8A00] mx-auto shadow-2xl bg-[#070B14] flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Partner Profile" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400">{(worker.full_name)?.charAt(0) || '?'}</span>
                )}
              </div>
            </div>
 
            {/* Worker Name & Role */}
            <div className="text-center mt-3 px-2">
              <h3 className="text-base font-black text-white tracking-tight leading-tight line-clamp-2 uppercase">
                {worker.full_name || 'Partner Name'}
              </h3>
              <span className="inline-block bg-[#FF8A00]/10 border border-[#FF8A00]/25 text-[#FF8A00] text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full mt-2">
                {profession}
              </span>
            </div>
 
            {/* Credentials details grid */}
            <div className="bg-[#070B14]/60 p-4 rounded-2xl border border-white/[0.04] space-y-2.5 text-xs text-left mt-4">
              <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.04]">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Partner ID</span>
                <span className="font-mono text-slate-200 font-extrabold">{worker.worker_id_code || worker.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-white/[0.04]">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Contact</span>
                <span className="text-slate-200 font-extrabold">{worker.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Status</span>
                <span className="text-emerald-400 font-black uppercase text-[9px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Verified Partner
                </span>
              </div>
            </div>
 
            {/* Card Front Footer */}
            <div className="text-center pt-2 mt-2 border-t border-white/[0.04]">
              <span className="text-[8px] text-slate-500 font-bold tracking-widest uppercase font-mono">
                WWW.VOLOHOME.COM
              </span>
            </div>
          </div>
        </div>
 
        {/* ==================== BACK SIDE BADGE ==================== */}
        <div className={`w-full max-w-[320px] md:flex md:flex-col md:items-center ${activeSide === 'back' ? 'flex flex-col items-center' : 'hidden md:flex'}`}>
          
          {/* Lanyard & Strap Visuals */}
          <div className="flex flex-col items-center mb-[-24px] relative z-20 no-print">
            <div className="w-6 h-28 bg-gradient-to-b from-[#FF8A00] to-[#E66E00] rounded-t-lg shadow-lg relative">
              <div className="absolute inset-y-0 left-1.5 w-0.5 bg-black/15"></div>
              <div className="absolute inset-y-0 right-1.5 w-0.5 bg-black/15"></div>
            </div>
            <div className="w-8 h-8 rounded-full border-[3px] border-slate-700 bg-slate-800 flex items-center justify-center -mt-1 shadow-md">
              <div className="w-3 h-5 rounded-full border-2 border-slate-500 bg-transparent -mt-2"></div>
            </div>
            <div className="w-2 h-6 bg-gradient-to-b from-slate-400 to-slate-500 shadow -mt-1 rounded-sm relative">
              <div className="absolute bottom-0 left-[-4px] w-4 h-2.5 rounded-full border-2 border-slate-400 bg-slate-500"></div>
            </div>
          </div>
 
          {/* Badge Container */}
          <div className="w-full h-[490px] bg-[#111827] border border-white/[0.08] rounded-[28px] shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 z-10">
            {/* Background design accents */}
            <div className="absolute top-0 -left-10 w-36 h-36 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 -right-10 w-36 h-36 bg-[#FF8A00]/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Left and Right Orange side curves */}
            <div className="absolute top-24 left-0 w-1 h-48 bg-[#FF8A00] rounded-r-lg shadow-[0_0_12px_rgba(255,138,0,0.4)] pointer-events-none" />
            <div className="absolute top-24 right-0 w-1 h-48 bg-[#FF8A00] rounded-l-lg shadow-[0_0_12px_rgba(255,138,0,0.4)] pointer-events-none" />
 
            {/* Badge Holder Slot at top */}
            <div className="w-12 h-2.5 bg-[#070B14] rounded-full mx-auto -mt-2.5 mb-2 relative z-10" />
 
            {/* Back Header */}
            <div className="flex flex-col items-center text-center mt-1 select-none">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo.jpeg" 
                  alt="VOLO Logo" 
                  className="h-7 w-7 rounded-lg object-contain border border-white/10" 
                />
                <span className="font-display font-black text-sm tracking-tight text-white leading-none">
                  VOLO NETWORK
                </span>
              </div>
              <span className="text-[8px] font-black text-[#FF8A00] tracking-widest uppercase mt-1">
                Safety & Compliance
              </span>
            </div>
 
            {/* Terms and Conditions */}
            <div className="px-2 mt-4 space-y-2.5 text-center">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-[#FF8A00] border-b border-orange-500/10 pb-1">
                TERMS & CONDITIONS
              </h4>
              <ul className="text-[9px] text-slate-300 text-left space-y-1.5 font-medium leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-[#FF8A00] font-bold">▪</span>
                  <span>This ID is property of VOLO and must be presented on customer service visits.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF8A00] font-bold">▪</span>
                  <span>Always wear VOLO official uniform and maintain professional code of conduct.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#FF8A00] font-bold">▪</span>
                  <span>Scan QR code to verify active credentials and live safety compliance.</span>
                </li>
              </ul>
            </div>
 
            {/* Verification Center */}
            <div className="space-y-2 mt-4 text-center">
              <div className="flex flex-col items-center justify-center p-1.5 bg-white rounded-2xl w-24 h-24 mx-auto shadow-xl border border-orange-500/10">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Verification QR Code"
                    className="w-20 h-20"
                  />
                ) : (
                  <Loader2 className="h-6 w-6 text-[#FF8A00] animate-spin" />
                )}
              </div>
              <span className="text-[8px] text-slate-400 font-extrabold tracking-widest uppercase block font-mono">
                SECURE QR VERIFICATION
              </span>
            </div>
 
            {/* Back Footer Details Grid */}
            <div className="bg-[#070B14]/40 px-3.5 py-2.5 rounded-xl border border-white/[0.04] flex items-center justify-between text-[10px] mt-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-[#FF8A00]" />
                <span className="text-slate-450 font-bold">Join Date:</span>
                <span className="text-slate-200 font-mono font-bold">{joinDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="text-slate-455 font-bold">Status:</span>
                <span className="text-emerald-400 font-bold uppercase text-[9px]">ACTIVE</span>
              </div>
            </div>
 
            {/* Card Back Footer */}
            <div className="text-center pt-2 mt-2 border-t border-white/[0.04]">
              <span className="text-[8px] text-slate-400 font-extrabold tracking-widest uppercase font-mono">
                POWERED BY VOLOHOME
              </span>
            </div>
          </div>
        </div>
 
      </div>
 
      {/* Modal Controls Bar (Hidden when printing) */}
      <div className="no-print mt-8 flex gap-4 z-10 select-none">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#FF8A00] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-950/20 cursor-pointer active:scale-95 duration-150"
        >
          <Printer className="h-4 w-4" />
          Print ID Card
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer active:scale-95 duration-150"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>
 
    </div>
  );
}
