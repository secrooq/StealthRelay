'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Database, 
  Lock, 
  Key, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  Copy, 
  Trash2, 
  CreditCard, 
  Check, 
  ArrowRight,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface UserSubInfo {
  email: string;
  plan: string;
  status: string;
  current_period_end: string | null;
}

interface ActiveDevice {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Active UI Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');

  // Loaders
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile Form state
  const [displayName, setDisplayName] = useState('User');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorUri, setTwoFactorUri] = useState('');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<{ id: string; api_key: string; created_at: string; }[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active Device sessions state
  const [devices, setDevices] = useState<ActiveDevice[]>([
    { id: '1', device: 'Macintosh (Apple M3 Pro)', browser: 'Chrome 119.0.0', ip: '196.172.122.88', location: 'Detroit, US', isCurrent: true },
    { id: '2', device: 'iPhone 15 Pro Max', browser: 'Safari 17.1.1', ip: '196.172.122.88', location: 'Detroit, US', isCurrent: false }
  ]);

  // Billing state
  const [subInfo, setSubInfo] = useState<UserSubInfo | null>(null);
  const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/settings');
      return;
    }

    if (status === 'authenticated') {
      fetch('/api/user/subscription')
        .then(res => res.json())
        .then(data => {
          setSubInfo(data);
        })
        .catch(err => {
          console.error("Failed to load subscription metrics", err);
        });

      fetch('/api/user/device')
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setDevices([
              { ...data, isCurrent: true },
              { id: '2', device: 'iPhone 15 Pro Max', browser: 'Safari 17.1.1', ip: data.ip, location: data.location, isCurrent: false }
            ]);
          }
        })
        .catch(err => {
          console.error("Failed to load active session device information", err);
        });

      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.displayName) setDisplayName(data.displayName);
          if (data.twoFactorEnabled) setIs2FAEnabled(data.twoFactorEnabled);
          
          fetch('/api/user/api-keys')
            .then(kr => kr.json())
            .then(kd => {
              if (kd.keys) setApiKeys(kd.keys);
              setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
        })
        .catch(err => {
          console.error("Failed to load user profile", err);
          setIsLoading(false);
        });
    }
  }, [status, router]);

  const handleSaveNickname = async () => {
    setMessage(null);
    setIsUpdating(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName })
      });
      if (!res.ok) throw new Error();
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password confirmation does not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network failure.' });
    } finally {
      setTimeout(() => setIsUpdating(false), 800);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError(null);

    if (totpCode.trim().length === 6) {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ twoFactorEnabled: true, twoFactorSecret, totpCode: totpCode.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        
        setIs2FAEnabled(true);
        setShow2FASetup(false);
        setTotpCode('');
        setMessage({ type: 'success', text: 'Two-Factor Authentication enabled successfully.' });
      } catch (err: any) {
        setTotpError(err.message || 'Failed to save security parameters.');
      }
    } else {
      setTotpError('Invalid confirmation code format. Please enter 6 digits.');
    }
  };

  const handleDeactivate2FA = async () => {
    setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled: false, twoFactorSecret: '' })
      });
      if (!res.ok) throw new Error();

      setIs2FAEnabled(false);
      setMessage({ type: 'success', text: 'Two-Factor Authentication deactivated.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disable two-factor authentication.' });
    }
  };

  const handleGenerateApiKey = async () => {
    setMessage(null);
    try {
      const res = await fetch('/api/user/api-keys', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate key');
      setApiKeys([data, ...apiKeys]);
      setMessage({ type: 'success', text: 'New API credential established successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to generate API key.' });
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/user/api-keys?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke key');
      setApiKeys(apiKeys.filter(k => k.id !== id));
      setMessage({ type: 'success', text: 'API credential revoked successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to revoke API key.' });
    }
  };

  const handleRevokeDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const handleManageBilling = async () => {
    setIsLaunchingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLaunchingPortal(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020203] text-slate-100 font-mono">
        <Loader2 className="w-10 h-10 text-[#e5c158] animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrieving Secure Settings...</p>
      </div>
    );
  }

  const activePlan = subInfo?.plan || 'FREE_TRIAL';

  return (
    <div className="min-h-screen bg-[#020203] text-slate-100 py-16 px-4 md:px-8 font-sans relative overflow-hidden">
      {/* Burnished sand-gold background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.035),transparent_60%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto z-10 relative">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-tighter text-white">
              System Settings & Security
            </h1>
            <span className="text-xs font-mono font-bold text-[#e5c158]/70 uppercase tracking-widest block mt-2">
              Operational Preferences // Secure Identity Console
            </span>
          </div>
        </div>

        {/* Dashboard Settings Panel Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Settings Sidebar Tabs */}
          <div className="md:col-span-1 space-y-2">
            {[
              { id: 'profile', name: 'Profile Settings', icon: Shield },
              { id: 'security', name: 'Security & 2FA', icon: Lock },
              { id: 'billing', name: 'Plan & Billing', icon: CreditCard }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setMessage(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-[11px] font-mono font-bold uppercase tracking-wider transition-all duration-300 text-left ${
                  activeTab === tab.id
                    ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#e5c158] shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                    : 'border-transparent bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            ))}

            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-white/10 bg-[#070709]/60 hover:bg-[#d4af37]/10 hover:border-[#d4af37]/30 text-slate-200 font-mono font-bold uppercase tracking-wider text-[11px] rounded-xl transition duration-300 mt-8 shadow-sm"
            >
              Back to Dashboard <ArrowRight className="w-3.5 h-3.5 text-[#e5c158]" />
            </Link>
          </div>

          {/* Tab Contents Pane */}
          <div className="md:col-span-3 border border-white/10 bg-[#070709]/85 backdrop-blur-xl shadow-2xl rounded-2xl p-8 min-h-[500px]">
            
            {message && (
              <div className={`p-4 mb-6 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider flex items-start gap-3 transition-all ${
                message.type === 'success' 
                  ? 'bg-[#d4af37]/10 border-[#d4af37]/20 text-[#e5c158]' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white mb-1">Profile Information</h2>
                  <p className="text-xs text-slate-400 font-mono">Manage your account details and display name.</p>
                </div>

                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                    <input 
                      type="text" 
                      value={session?.user?.email || ''} 
                      disabled
                      className="w-full px-4 py-3 rounded-lg border border-white/5 bg-[#030304] text-slate-500 focus:outline-none cursor-not-allowed select-none font-mono text-xs font-bold" 
                    />
                    <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-wider">Email addresses are tied to your account identity and cannot be changed.</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-950 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none transition font-mono text-xs font-bold" 
                    />
                  </div>

                  <button 
                    onClick={handleSaveNickname}
                    disabled={isUpdating}
                    className="px-6 py-3.5 bg-[#d4af37]/10 hover:bg-[#d4af37] border border-[#d4af37]/30 hover:border-transparent text-[#e5c158] hover:text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition duration-300 disabled:opacity-50 shadow-sm"
                  >
                    {isUpdating ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY & 2FA TAB */}
            {activeTab === 'security' && (
              <div className="space-y-10">
                
                {/* Change Password Block */}
                <div>
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white mb-1">Change Password</h2>
                  <p className="text-xs text-slate-400 font-mono mb-6">Modify the credentials used to access your StealthRelay account.</p>

                  <form onSubmit={handlePasswordChange} className="space-y-5 max-w-xl">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Current Password</label>
                      <input 
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-950 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/35 focus:outline-none transition font-mono text-xs font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">New Password (Min 8 Characters)</label>
                      <input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-950 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/35 focus:outline-none transition font-mono text-xs font-bold" 
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">Confirm New Password</label>
                      <input 
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg border border-white/10 bg-slate-950 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/35 focus:outline-none transition font-mono text-xs font-bold" 
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isUpdating}
                      className="px-6 py-3.5 bg-slate-950 hover:bg-white/5 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-sm border border-white/10"
                    >
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin text-[#e5c158]" /> : 'Update Password'}
                    </button>
                  </form>
                </div>

                <div className="border-t border-white/10" />

                {/* 2FA Authenticator Setup */}
                <div>
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white mb-1">Two-Factor Authentication (2FA)</h2>
                  <p className="text-xs text-slate-400 font-mono mb-6">Add an extra layer of system security by requiring a verification code from your mobile authenticator app on login.</p>

                  {is2FAEnabled ? (
                    <div className="p-6 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[#e5c158]" />
                        <div>
                          <span className="text-white font-mono font-bold text-sm block">2FA Protection Active</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-1">Your account is fully secured.</span>
                        </div>
                      </div>
                      <button 
                        onClick={handleDeactivate2FA}
                        className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 hover:text-red-400 transition bg-slate-950 px-4 py-2 rounded-lg border border-white/10 hover:border-red-500/30"
                      >
                        Deactivate
                      </button>
                    </div>
                  ) : show2FASetup ? (
                    <div className="p-8 border border-white/10 bg-[#050507] rounded-2xl max-w-xl space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex justify-between items-start border-b border-white/5 pb-4">
                        <span className="text-[11px] text-white font-mono font-bold uppercase tracking-wider">Step 1: Scan QR Code</span>
                        <button onClick={() => setShow2FASetup(false)} className="text-xs font-mono font-bold text-slate-500 hover:text-slate-300 uppercase">Cancel Setup</button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        {/* Real QR Code */}
                        <div className="bg-white p-4 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm w-40 h-40">
                          {twoFactorUri ? (
                            <QRCodeSVG value={twoFactorUri} size={130} />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                               <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                               <span className="text-xs font-semibold">Generating...</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 flex-1 w-full">
                          <p className="text-xs font-mono text-slate-400 leading-relaxed font-semibold">
                            Scan this QR Code with your Google Authenticator or Microsoft Authenticator app.
                          </p>
                          <div className="p-3 bg-slate-950 border border-white/10 rounded-lg text-[#e5c158] text-xs text-center font-mono font-bold shadow-sm break-all">
                            Secret: {twoFactorSecret || 'GENERATING...'}
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleVerify2FA} className="space-y-4 pt-6 border-t border-white/5">
                        <label className="text-xs text-white block font-mono font-bold uppercase tracking-wider">Step 2: Enter 6-Digit Code</label>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            placeholder="123456" 
                            value={totpCode}
                            onChange={(e) => setTotpCode(e.target.value)}
                            maxLength={6}
                            required
                            className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-[#0d0d11] text-[#e5c158] focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 focus:outline-none transition text-center font-bold tracking-widest text-lg shadow-sm font-mono" 
                          />
                          <button 
                            type="submit"
                            className="px-6 py-3 bg-[#d4af37] text-black font-mono font-black uppercase tracking-wider text-xs rounded-xl hover:bg-[#d4af37]/80 transition duration-300 shadow-sm"
                          >
                            Verify & Enable
                          </button>
                        </div>
                        {totpError && <p className="text-xs text-red-400 font-mono font-bold mt-2">⚠ {totpError}</p>}
                      </form>
                    </div>
                  ) : (
                    <button 
                      onClick={async () => {
                        setShow2FASetup(true);
                        try {
                          const res = await fetch('/api/auth/2fa/generate');
                          const data = await res.json();
                          if (data.secret) {
                            setTwoFactorSecret(data.secret);
                            setTwoFactorUri(data.uri);
                          }
                        } catch (err) {}
                      }}
                      className="px-6 py-3.5 bg-slate-950 border border-white/10 text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-white/5 transition duration-300 flex items-center gap-2 shadow-sm"
                    >
                      <Smartphone className="w-5 h-5 text-[#e5c158]" /> Enable Two-Factor Authentication
                    </button>
                  )}
                </div>

                <div className="border-t border-white/10" />

                {/* Active Sessions list */}
                <div>
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white mb-1">Active Sessions</h2>
                  <p className="text-xs text-slate-400 font-mono mb-6">Monitor and manage other devices currently logged into your account.</p>

                  <div className="space-y-3 max-w-2xl">
                    {devices.map((dev) => (
                      <div key={dev.id} className="p-5 border border-white/10 bg-slate-950/60 rounded-xl flex items-center justify-between transition hover:bg-white/5 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-[#030304] p-3 rounded-lg border border-white/5">
                            {dev.device.toLowerCase().includes('mac') ? <Laptop className="w-6 h-6 text-slate-400" /> : <Smartphone className="w-6 h-6 text-slate-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-white font-mono font-bold text-xs uppercase tracking-wider">{dev.device}</span>
                              {dev.isCurrent && (
                                <span className="bg-[#d4af37]/10 text-[#e5c158] border border-[#d4af37]/20 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest">Active Device</span>
                              )}
                            </div>
                            <span className="text-slate-450 text-[10px] font-mono">{dev.browser} • IP: {dev.ip} • {dev.location}</span>
                          </div>
                        </div>

                        {!dev.isCurrent && (
                          <button 
                            onClick={() => handleRevokeDevice(dev.id)}
                            className="p-2.5 border border-red-500/20 bg-slate-900 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500/40 transition duration-300 shadow-sm"
                            title="Revoke Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {devices.length === 0 && (
                      <p className="text-center text-slate-500 py-6 font-mono">No other active sessions found.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* BILLING PLAN TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-white mb-1">Subscription Details</h2>
                  <p className="text-xs text-slate-400 font-mono">View your current plan, billing history, and payment methods.</p>
                </div>

                <div className="border border-white/10 bg-slate-950 p-8 rounded-2xl space-y-6 max-w-xl shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1 font-mono font-bold">Current Plan</span>
                    <span className="text-xl font-mono font-bold text-white uppercase tracking-wider block">
                      {activePlan === 'FREE_TRIAL' ? 'Free Trial' : activePlan === 'CONTRACTOR' ? 'Contractor' : activePlan === 'PHANTOM' ? 'Phantom Security' : 'Enterprise Sovereign'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-450 uppercase tracking-widest block mb-1 font-mono font-bold">Account Status</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#e5c158] font-mono font-bold text-[10px] uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {subInfo?.status === 'ACTIVE' ? 'Active' : 'Active Trial'}
                    </span>
                  </div>

                  {subInfo?.current_period_end && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1 font-mono font-bold">Next Billing Date</span>
                      <span className="text-white block font-mono font-bold text-xs">{new Date(subInfo.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-6 mt-6 flex flex-col gap-3">
                    {activePlan === 'FREE_TRIAL' ? (
                      <Link
                        href="/pricing"
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4af37] text-black font-mono font-black uppercase tracking-wider text-xs rounded-xl hover:bg-[#d4af37]/80 transition duration-300 shadow-sm"
                      >
                        Upgrade Plan
                      </Link>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleManageBilling}
                          disabled={isLaunchingPortal}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4af37] text-black font-mono font-black uppercase tracking-wider text-xs rounded-xl hover:bg-[#d4af37]/80 transition duration-300 disabled:opacity-50 shadow-sm"
                        >
                          {isLaunchingPortal ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <CreditCard className="w-4 h-4 text-black" />}
                          <span>Upgrade / Downgrade Plan</span>
                        </button>
                        <Link
                          href="/pricing"
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-white/5 border border-white/10 text-white font-mono font-bold uppercase tracking-wider text-xs rounded-xl transition duration-300 shadow-sm"
                        >
                          Compare Plans
                        </Link>
                      </div>
                    )}
                    {activePlan !== 'FREE_TRIAL' && (
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-2 text-center">
                        Secure billing operations (upgrade, downgrade, payment method, cancellation) are handled securely through the Stripe customer portal.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
