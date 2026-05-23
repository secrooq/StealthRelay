'use client';

import React, { useState, useEffect } from 'react';
import SecretUploader from '@/components/SecretUploader';
import { Shield } from 'lucide-react';

export default function SecretPage() {
  const [userPlan, setUserPlan] = useState<string>('FREE_TRIAL');

  useEffect(() => {
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.plan) {
          setUserPlan(data.plan);
        }
      })
      .catch(err => console.error("Failed to load plan", err));
  }, []);

  const getPlanDetails = () => {
    switch (userPlan) {
      case 'CONTRACTOR':
        return { name: 'Private Contractor', limit: '50MB Limit • Unlimited retention' };
      case 'PHANTOM':
        return { name: 'Phantom Entity', limit: '100MB Limit • Unlimited retention' };
      case 'ENTERPRISE':
        return { name: 'Enterprise Core', limit: '500MB Limit • Dedicated routing gateways' };
      case 'FREE_TRIAL':
      default:
        return { name: 'Free Trial', limit: '10MB Limit • 24-hour retention' };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="flex flex-col items-center min-h-[80vh] py-12 px-4 bg-slate-950 font-sans">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-[#11100e] border border-[#d4af37]/20 rounded-2xl mb-6 shadow-sm">
          <Shield className="w-8 h-8 text-[#e5c158]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white flex items-center justify-center gap-3 flex-wrap">
          Secure <span className="text-[#e5c158]">Share</span>
          <span className="bg-[#d4af37]/10 text-[#e5c158] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-[#d4af37]/20">{planDetails.name}</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed mb-2">
          Create a burn-after-reading link. Your payload is encrypted in your browser before upload. We never see your data.
        </p>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
          Allocation: {planDetails.limit}
        </p>
      </div>

      <SecretUploader />
    </div>
  );
}
