'use client';

import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, Terminal, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TurnstileWidget from '@/components/TurnstileWidget';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [otpFailures, setOtpFailures] = useState(0);
  const [resendSuccessMessage, setResendSuccessMessage] = useState('');
  const router = useRouter();

  const resetLoginState = () => {
    setOtpRequired(false);
    setOtp('');
    setOtpFailures(0);
    setResendCount(0);
    setTurnstileToken('');
    setResendSuccessMessage('');
  };

  const handleResendOtp = async () => {
    if (resendCount >= 1 || isLoading) return;

    setIsLoading(true);
    setError('');
    setResendSuccessMessage('');

    try {
      const res = await fetch('/api/admin/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend OTP.');
      }

      setResendCount(prev => prev + 1);
      setResendSuccessMessage('A new OTP has been dispatched to your email address.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpRequired && (!email.trim() || !secret.trim() || !turnstileToken)) return;
    if (otpRequired && !otp.trim()) return;

    setIsLoading(true);
    setError('');
    setResendSuccessMessage('');

    try {
      const endpoint = otpRequired ? '/api/admin/verify-otp' : '/api/admin/login';
      const payload = otpRequired ? { email, secret, otp } : { email, secret, turnstileToken };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (otpRequired) {
          const newFailures = otpFailures + 1;
          setOtpFailures(newFailures);
          if (newFailures >= 2) {
            setError(data.error || 'Too many failed OTP attempts. Security bypass terminated.');
            setTimeout(() => {
              resetLoginState();
            }, 2500);
            return;
          }
        }
        throw new Error(data.error || 'Access Denied.');
      }

      if (data.otpRequired) {
        setOtpRequired(true);
        setOtp('');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-6 relative overflow-hidden font-mono selection:bg-[#d4af37]/30 selection:text-white">
      {/* Immersive Cyberpunk Telemetry Grid & Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] border border-[#d4af37]/[0.025] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,55,0.015),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding HUD circle logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/20 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.1)] mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4af37]/5 to-transparent h-[200%] w-full animate-[scan_3s_linear_infinite]" />
            <Shield className="w-6 h-6 text-[#e5c158] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
            STEALTH<span className="text-[#e5c158] drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">RELAY</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#e5c158]/60 font-mono mt-1.5">
            ADMINISTRATIVE SECURE NODE PORTAL
          </p>
        </div>

        {/* Form Panel */}
        <div className="relative border border-white/10 bg-[#070709]/95 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.03)] overflow-hidden">
          {/* Tactical reticle markers */}
          <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/30" />
          <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]/30" />
          <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37]/30" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/30" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {!otpRequired ? (
              <>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                    OPERATIVE EMAIL
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@stealthrelay.com"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all pl-10 placeholder:text-slate-700 font-mono font-medium"
                      disabled={isLoading}
                      autoFocus
                    />
                    <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-655" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                    BYPASS SECRET KEY
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="••••••••••••••••••"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all pl-10 placeholder:text-slate-700 font-mono font-medium"
                      disabled={isLoading}
                    />
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-655" />
                  </div>
                </div>

                <TurnstileWidget onVerify={setTurnstileToken} />
              </>
            ) : (
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  6-DIGIT EMAIL CODE
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-black/50 border border-[#d4af37]/40 text-[#e5c158] rounded-md px-4 py-3.5 text-center font-mono text-xl tracking-[0.2em] font-black focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] pl-10"
                    disabled={isLoading}
                    autoFocus
                    maxLength={6}
                  />
                  <Terminal className="absolute left-3.5 top-4.5 w-4 h-4 text-[#e5c158]" />
                </div>
                <p className="text-[9px] text-slate-500 mt-3 text-center uppercase tracking-wider">
                  An OTP has been dispatched to the provided operative email address.
                </p>
                <div className="flex items-center justify-between mt-4">
                  {resendCount < 1 ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-[9px] text-[#e5c158] hover:text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                      Resend OTP Code
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                      Resend limit reached
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={resetLoginState}
                    className="text-[9px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
                {resendSuccessMessage && (
                  <p className="text-[9px] text-green-400 mt-2 text-center font-bold uppercase tracking-wider animate-pulse">
                    {resendSuccessMessage}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 bg-red-955/20 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono uppercase tracking-wider font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  🚨 CRITICAL: {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (!otpRequired && (!email || !secret || !turnstileToken)) || (otpRequired && !otp)}
              className="w-full py-3.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-mono font-black uppercase tracking-[0.2em] rounded-md transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {otpRequired ? 'VERIFYING OTP...' : 'VERIFYING KEY...'}
                </>
              ) : (
                otpRequired ? 'AUTHORIZE PORTAL' : 'ESTABLISH LINK'
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="text-center mt-6">
          <p className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">
            All access attempts are cryptographically audited.
          </p>
        </div>
      </div>
    </div>
  );
}
