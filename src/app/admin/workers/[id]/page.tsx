'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusBadge from '@/components/admin/shared/StatusBadge';
import LoadingSkeleton from '@/components/admin/shared/LoadingSkeleton';
import ConfirmModal from '@/components/admin/shared/ConfirmModal';
import { IdCard, Printer, X, ShieldCheck, AlertCircle, ExternalLink, Check, Ban, Loader2 } from 'lucide-react';
import DigitalIdCardModal from '@/components/worker/DigitalIdCardModal';

interface WorkerDetail {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: string;
  kyc_status: string;
  aadhar_front_url: string | null;
  aadhar_back_url: string | null;
  pan_url: string | null;
  selfie_url: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  razorpayx_contact_id: string | null;
  razorpayx_fund_account_id: string | null;
  commission_wallet_balance: number;
  rating: number;
  total_jobs: number;
  created_at: string;
  is_active: boolean;
  wallet_transactions: any[];
  settlements: any[];
  dob?: string | null;
  worker_id_code?: string | null;
  skills?: string[];
  service_categories?: string[];
}

export default function WorkerDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Document states
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [kycReviewState, setKycReviewState] = useState<any>(null);
  
  // Checklist verification states
  const [aadhaarApproved, setAadhaarApproved] = useState(false);
  const [panApproved, setPanApproved] = useState(false);
  const [selfieApproved, setSelfieApproved] = useState(false);
  const [remarks, setRemarks] = useState('');
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  // Category management states
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);

  async function fetchWorkerAndKyc() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workers/${id}`);
      if (!res.ok) {
        router.push('/admin/workers');
        return;
      }
      const data = await res.json();
      setWorker(data);
      setSelectedCategories(data.service_category_ids || []);

      // Fetch all service categories for selection
      const catsRes = await fetch('/api/admin/services');
      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setAllCategories(catsData || []);
      }

      // Fetch kyc documents and signed URLs
      const docsRes = await fetch(`/api/admin/workers/${id}/kyc-docs`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setKycDocs(docsData.documents || []);
        setKycReviewState(docsData.kycState);
        
        if (docsData.kycState) {
          setAadhaarApproved(docsData.kycState.aadhaar_status === 'APPROVED');
          setPanApproved(docsData.kycState.pan_status === 'APPROVED');
          setSelfieApproved(docsData.kycState.selfie_status === 'APPROVED');
          setRemarks(docsData.kycState.remarks || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveCategories = async () => {
    if (!worker) return;
    setSavingCategories(true);
    try {
      const res = await fetch(`/api/admin/workers/${worker.id}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedCategories })
      });
      if (res.ok) {
        await fetchWorkerAndKyc();
      } else {
        alert('Failed to save service categories.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving categories.');
    } finally {
      setSavingCategories(false);
    }
  };

  useEffect(() => {
    if (id) fetchWorkerAndKyc();
  }, [id]);



  const handleKycAction = async (actionType: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION') => {
    if (!worker) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/workers/${worker.id}/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          reason: remarks,
          fieldApproval: {
            aadhaar: aadhaarApproved ? 'APPROVED' : 'REJECTED',
            pan: panApproved ? 'APPROVED' : 'REJECTED',
            selfie: selfieApproved ? 'APPROVED' : 'REJECTED'
          }
        })
      });

      if (res.ok) {
        await fetchWorkerAndKyc();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!worker) return;
    setActionLoading(true);
    const action = worker.is_active ? 'SUSPEND' : 'ACTIVATE';
    try {
      const res = await fetch(`/api/admin/workers/${worker.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        await fetchWorkerAndKyc();
        setShowStatusModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const idCardPhoto = kycDocs.find(d => d.document_type === 'PROFILE_PHOTO')?.signedUrl 
    || kycDocs.find(d => d.document_type === 'SELFIE_VERIFICATION')?.signedUrl;

  const profession = (worker?.service_categories && worker.service_categories.length > 0)
    ? worker.service_categories.join(', ')
    : (worker?.skills && worker.skills.length > 0)
      ? worker.skills.join(', ')
      : 'Service Professional';

  if (loading || !worker) {
    return <LoadingSkeleton rows={6} cols={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">{worker.full_name || worker.bank_account_name || 'Unnamed Worker'}</h1>
          <p className="text-xs text-slate-500">Worker ID: {worker.worker_id_code || worker.id}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/workers')}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors select-none"
        >
          Back to list
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Profile Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-24 w-24 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-rose-400 text-3xl font-bold select-none overflow-hidden">
              {worker.full_name?.charAt(0) || '?'}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{worker.full_name || 'Unnamed Worker'}</h3>
              <p className="text-xs text-slate-500">{worker.phone}</p>
              <p className="text-xs text-slate-500">{worker.email || 'No email registered'}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <StatusBadge status={worker.status} />
              <StatusBadge status={worker.kyc_status} />
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Rating</span>
              <span className="font-semibold text-amber-400">★ {Number(worker.rating).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Jobs</span>
              <span className="font-semibold text-slate-200">{worker.total_jobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Joined On</span>
              <span className="font-semibold text-slate-200">
                {new Date(worker.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-2">
            {worker.kyc_status === 'APPROVED' && (
              <button
                type="button"
                onClick={() => setShowIdCardModal(true)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <IdCard className="h-4 w-4 text-[#FF8A00]" />
                View Digital ID Card
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                worker.is_active
                  ? 'bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600/20'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {worker.is_active ? 'Suspend Account' : 'Activate Account'}
            </button>
          </div>
        </div>

        {/* Center Panel - KYC Documents with signed URLs and itemized verification review */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 select-none">
            <h3 className="text-base font-bold text-white">KYC Documents Verification</h3>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Step-by-step Review</span>
          </div>

          {/* Verification documents grid */}
          <div className="grid grid-cols-2 gap-4">
            {['PROFILE_PHOTO', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN_CARD', 'SELFIE_VERIFICATION'].map((type) => {
              const doc = kycDocs.find(d => d.document_type === type);
              const labelMap: Record<string, string> = {
                PROFILE_PHOTO: 'Profile Portrait Photo',
                AADHAAR_FRONT: 'Aadhaar Card Front',
                AADHAAR_BACK: 'Aadhaar Card Back',
                PAN_CARD: 'PAN Card Doc',
                SELFIE_VERIFICATION: 'Selfie Verification Image'
              };

              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold select-none">{labelMap[type]}</span>
                    {doc && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {doc.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="border border-slate-800 bg-slate-950 rounded-lg h-32 flex flex-col items-center justify-center overflow-hidden relative group">
                    {doc?.signedUrl ? (
                      <>
                        <img 
                          src={doc.signedUrl} 
                          alt={labelMap[type]} 
                          className="object-contain h-full w-full"
                        />
                        <a 
                          href={doc.signedUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity text-[10px] font-semibold text-white cursor-pointer no-print"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Original
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-slate-600 font-medium select-none">Not uploaded</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verification Review Checklist Panel */}
          <div className="border-t border-slate-850 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Verification Checklist</h4>
            
            <div className="space-y-3">
              {/* Aadhaar checklist */}
              <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={aadhaarApproved}
                  onChange={(e) => setAadhaarApproved(e.target.checked)}
                  className="rounded border-slate-800 text-rose-500 focus:ring-rose-500/20 bg-slate-950 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">Aadhaar Front & Back Verified</span>
                  <p className="text-[10px] text-slate-500">Technician address matches registered profile</p>
                </div>
              </label>

              {/* PAN checklist */}
              <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={panApproved}
                  onChange={(e) => setPanApproved(e.target.checked)}
                  className="rounded border-slate-800 text-rose-500 focus:ring-rose-500/20 bg-slate-950 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">PAN Card Verified</span>
                  <p className="text-[10px] text-slate-500">PAN name matches Aadhaar name credentials</p>
                </div>
              </label>

              {/* Selfie checklist */}
              <label className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selfieApproved}
                  onChange={(e) => setSelfieApproved(e.target.checked)}
                  className="rounded border-slate-800 text-rose-500 focus:ring-rose-500/20 bg-slate-950 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">Selfie & Profile Portrait Match</span>
                  <p className="text-[10px] text-slate-500">Selfie image matches the uploaded ID card photos</p>
                </div>
              </label>
            </div>

            {/* Remarks text field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Verification Review Notes / Remarks</label>
              <textarea
                placeholder="e.g., Selfie is blurry, please re-upload. Or details match."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500 transition-colors h-16 resize-none"
              />
            </div>

            {/* Verification review actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleKycAction('APPROVE')}
                disabled={actionLoading || !aadhaarApproved || !panApproved || !selfieApproved}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 disabled:cursor-not-allowed text-white py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Check className="h-4 w-4" /> Approve Profile
              </button>
              <button
                type="button"
                onClick={() => handleKycAction('REQUEST_RESUBMISSION')}
                disabled={actionLoading}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <AlertCircle className="h-4 w-4" /> Request Corrections
              </button>
              <button
                type="button"
                onClick={() => handleKycAction('REJECT')}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Ban className="h-4 w-4" /> Reject Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Bank Details & Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 select-none">Payment Details</h3>

          <div className="space-y-3 text-sm">
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider select-none">Settlement Payout Bank</span>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-200">{worker.bank_account_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Account Number</span>
                <span className="font-semibold text-slate-250 font-mono">{worker.bank_account_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">IFSC Code</span>
                <span className="font-semibold text-slate-200">{worker.bank_ifsc || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-between p-1">
              <span className="text-slate-500">Commission Wallet Balance</span>
              <span className="font-bold text-emerald-400">₹{Number(worker.commission_wallet_balance).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider select-none">Wallet Transactions</span>
            <div className="border border-slate-800 rounded-lg divide-y divide-slate-800/40 text-xs overflow-hidden max-h-[160px] overflow-y-auto">
              {worker.wallet_transactions.length > 0 ? (
                worker.wallet_transactions.map((t) => (
                  <div key={t.id} className="p-3 flex justify-between items-center bg-slate-950/40">
                    <div className="space-y-0.5">
                      <span className={`font-bold ${t.type === 'TOP_UP' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type}
                      </span>
                      <p className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-slate-200">₹{Number(t.amount).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-600">No transactions recorded</div>
              )}
            </div>
          </div>

          {/* Approved Service Categories */}
          <div className="border-t border-slate-800/60 pt-6 space-y-4">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider select-none">Approved Service Categories</span>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {allCategories.length > 0 ? (
                allCategories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <label key={cat.id} className="flex items-center gap-3 p-2 bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-lg cursor-pointer transition-colors text-xs">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                          }
                        }}
                        className="rounded border-slate-800 text-rose-500 focus:ring-rose-500/20 bg-slate-950 cursor-pointer h-3.5 w-3.5"
                      />
                      <span className="font-bold text-slate-200">{cat.name}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 italic">Loading categories...</div>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleSaveCategories}
              disabled={savingCategories || allCategories.length === 0}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {savingCategories ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Categories...
                </>
              ) : (
                'Save Categories'
              )}
            </button>
          </div>
        </div>
      </div>



      {/* Status Toggle Modal */}
      <ConfirmModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusToggle}
        title={worker.is_active ? 'Suspend Worker Account' : 'Activate Worker Account'}
        message={
          worker.is_active
            ? 'Suspended workers will be logged out and prohibited from receiving service orders. Confirm suspension?'
            : 'Re-activate this worker and allow them to take booking orders again?'
        }
        confirmText={worker.is_active ? 'Suspend' : 'Activate'}
        isLoading={actionLoading}
      />

      {/* ID Card Modal */}
      <DigitalIdCardModal
        isOpen={showIdCardModal}
        onClose={() => setShowIdCardModal(false)}
        worker={worker}
        photoUrl={idCardPhoto || null}
      />
    </div>
  );
}
