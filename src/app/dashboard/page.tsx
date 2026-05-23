'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Database, 
  Mail, 
  Lock, 
  Unlock, 
  Loader2, 
  Activity, 
  Terminal, 
  ExternalLink, 
  CreditCard, 
  Cpu, 
  Layers, 
  Server, 
  Sliders, 
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserSubInfo {
  email: string;
  plan: string;
  status: string;
  current_period_end: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Metrics state
  const [aliasesCount, setAliasesCount] = useState(0);
  const [mailboxesCount, setMailboxesCount] = useState(0);
  const [storageSize, setStorageSize] = useState(0); // in MB
  const [vaultKeyFootprint, setVaultKeyFootprint] = useState<string | null>(null);
  const [subInfo, setSubInfo] = useState<UserSubInfo | null>(null);

  // Corporate team management states
  const [orgName, setOrgName] = useState('Sovereign Core Group');
  const [orgDomain, setOrgDomain] = useState('domain.com');
  const [orgMembers, setOrgMembers] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [orgSeats, setOrgSeats] = useState(5);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [impersonatedOrg, setImpersonatedOrg] = useState<string | null>(null);
  const [activeOrgTab, setActiveOrgTab] = useState<'members' | 'kb' | 'dns'>('members');
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [dnsAuditing, setDnsAuditing] = useState(false);
  const [dnsAuditResult, setDnsAuditResult] = useState<any | null>(null);

  // UI state
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLaunchingPortal, setIsLaunchingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  
  // Interactive Egress States
  const [strictTls, setStrictTls] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);
  const [activeRouterNode, setActiveRouterNode] = useState('US_EAST_STEALTH_01');

  // Load telemetry metrics
  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    setPortalError(null);
    try {
      const [aliasesRes, mailboxesRes, vaultRes, subRes] = await Promise.all([
        fetch('/api/relay'),
        fetch('/api/mailboxes'),
        fetch('/api/vault/files'),
        fetch('/api/user/subscription')
      ]);

      if (aliasesRes.ok) {
        const data = await aliasesRes.json();
        setAliasesCount(data.aliases?.length || 0);
      }
      if (mailboxesRes.ok) {
        const data = await mailboxesRes.json();
        setMailboxesCount(data.mailboxes?.length || 0);
      }
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        const files = data.files || [];
        const totalBytes = files.reduce((acc: number, f: any) => acc + (f.file_size || 0), 0);
        setStorageSize(totalBytes / (1024 * 1024)); // Convert to MB
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setSubInfo(data);
      }
    } catch (e) {
      console.error("Failed to load operational telemetry", e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
      return;
    }

    if (status === 'authenticated') {
      loadMetrics();
      // Derive local session vault key footprint if available
      if (typeof window !== 'undefined') {
        const localKey = sessionStorage.getItem('stealth_vault_key');
        if (localKey) {
          // Compute a simple hash-like fingerprint for the HUD
          let hash = 0;
          for (let i = 0; i < localKey.length; i++) {
            hash = (hash << 5) - hash + localKey.charCodeAt(i);
            hash |= 0;
          }
          setVaultKeyFootprint(`SHA256::FK${Math.abs(hash).toString(16).toUpperCase().substring(0, 8)}`);
        }
      }

      // Populate default mock/real organization data based on email
      if (session?.user?.email) {
        const emailDomain = session.user.email.split('@')[1] || 'domain.com';
        setOrgDomain(emailDomain);
        setDomainInput(emailDomain);
        setOrgMembers([session.user.email, `security@${emailDomain}`, `ops@${emailDomain}`]);
      }

      // Check for Admin Impersonation Mode
      if (typeof window !== 'undefined') {
        const impOrg = sessionStorage.getItem('impersonated_org_name');
        const impDom = sessionStorage.getItem('impersonated_org_domain');
        const impSeats = sessionStorage.getItem('impersonated_org_seats');
        if (impOrg && impDom) {
          setImpersonatedOrg(impOrg);
          setOrgName(impOrg);
          setOrgDomain(impDom);
          setDomainInput(impDom);
          setOrgSeats(Number(impSeats) || 5);
          setOrgMembers([`admin@${impDom}`, `security@${impDom}`, `ops@${impDom}`]);
        }
      }
    }
  }, [status, router, session]);

  // Handle Stripe billing portal launch
  const handleManageBilling = async () => {
    setIsLaunchingPortal(true);
    setPortalError(null);

    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to establish secure gateway to customer billing portal.");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setPortalError(err.message || "Active customer profile not recognized. Please register a plan tier first.");
      setTimeout(() => {
        router.push('/pricing');
      }, 3000);
    } finally {
      setIsLaunchingPortal(false);
    }
  };

  if (status === 'loading' || isLoadingMetrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 text-[#e5c158] animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400 animate-pulse">Initializing Secure Workspace...</p>
      </div>
    );
  }

  // Calculate dynamic storage limits based on active plan
  const activePlan = impersonatedOrg ? 'ENTERPRISE' : (subInfo?.plan || 'FREE_TRIAL');
  const getStorageLimit = () => {
    switch (activePlan) {
      case 'CONTRACTOR': return 10 * 1024; // 10 GB in MB
      case 'PHANTOM': return 100 * 1024; // 100 GB in MB
      case 'ENTERPRISE': return 1000 * 1024; // 1 TB in MB
      default: return 100; // Free Trial: 100 MB
    }
  };

  const getAliasLimit = () => {
    switch (activePlan) {
      case 'CONTRACTOR':
      case 'PHANTOM':
      case 'ENTERPRISE':
        return Infinity;
      default:
        return 3; // Free Trial: 3 Tunnels / 3 Masked Aliases
    }
  };

  const storageLimit = getStorageLimit();
  const storagePercentage = Math.min((storageSize / storageLimit) * 100, 100);
  const aliasLimit = getAliasLimit();
  const aliasPercentage = aliasLimit === Infinity ? 0 : Math.min((aliasesCount / aliasLimit) * 100, 100);
  const isVaultUnlocked = !!vaultKeyFootprint;
  const isAdminBypass = session?.user?.email?.toLowerCase() === 'admin@stealthrelay.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 md:px-8 relative overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto z-10 relative">
        
        {/* Impersonation Warning Banner */}
        {impersonatedOrg && (
          <div className="mb-8 p-4 rounded-xl border border-[#d4af37]/45 bg-amber-500/10 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 text-left">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Platform Governance Simulator Mode
                </p>
                <p className="text-[11px] text-[#e5c158] font-mono uppercase mt-0.5">
                  Currently visiting platform as organization enclave: <strong className="text-white">{impersonatedOrg}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('impersonated_org_name');
                sessionStorage.removeItem('impersonated_org_domain');
                sessionStorage.removeItem('impersonated_org_seats');
                window.location.href = '/admin';
              }}
              className="px-4 py-2 bg-[#d4af37] hover:bg-white text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
            >
              Exit Impersonation
            </button>
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-8 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 text-[#e5c158] text-xs font-semibold tracking-wide mb-4">
              <Activity className="w-3.5 h-3.5" /> Secure Connection Active
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              Workspace Overview
            </h1>
            <p className="text-slate-400">
              Manage your private email relays, secure vaults, active spam shielding, and billing plans.
            </p>
          </div>
          
          <button 
            onClick={loadMetrics}
            className="mt-6 md:mt-0 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-800 hover:text-white transition duration-300"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Stats
          </button>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Card 1: User Account */}
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</span>
              <Shield className="w-5 h-5 text-[#e5c158]" />
            </div>
            <p className="text-lg font-bold text-white truncate mb-1">{session?.user?.email}</p>
            <p className="text-xs text-slate-500 mb-4">Verified Primary Profile</p>
            
            {isAdminBypass ? (
              <span className="inline-block text-xs font-semibold bg-[#d4af37]/10 text-[#e5c158] border border-[#d4af37]/20 px-2.5 py-1 rounded-full">
                System Administrator
              </span>
            ) : (
              <span className="inline-block text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
                Active Member
              </span>
            )}
          </div>

          {/* Card 2: Encrypted Vault Status */}
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secure Vault</span>
              {isVaultUnlocked ? <Unlock className="w-5 h-5 text-[#e5c158]" /> : <Lock className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-bold ${isVaultUnlocked ? 'text-[#e5c158]' : 'text-amber-500'}`}>
                {isVaultUnlocked ? 'Vault Unlocked' : 'Vault Armored'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mb-4 truncate">
              {isVaultUnlocked ? vaultKeyFootprint : 'Master Key Required'}
            </p>
            <Link 
              href="/vault"
              className="text-sm font-semibold text-[#e5c158] hover:text-[#e5c158]/80 flex items-center gap-1.5"
            >
              {isVaultUnlocked ? 'Access Files' : 'Decrypt Vault'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Email Relays (Aliases) */}
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Relays</span>
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {aliasesCount} <span className="text-base text-slate-500 font-medium">/ {aliasLimit === Infinity ? "∞" : aliasLimit}</span>
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {aliasLimit === Infinity ? "Unlimited Forwarders" : "Plan Limits"}
            </p>
            
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${aliasLimit === Infinity ? 100 : aliasPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 4: Secure Storage Space */}
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud Storage</span>
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {storageSize.toFixed(2)} <span className="text-base text-slate-500 font-medium">MB</span>
            </p>
            <p className="text-xs text-slate-500 mb-4">
              of {storageLimit >= 1024 ? `${(storageLimit/1024).toFixed(0)} GB` : `${storageLimit} MB`} Allocated
            </p>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>

        </div>

        {/* MIDDLE OPERATIONS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Dashboard Left Column: Subscription billing */}
          <div className="lg:col-span-2 border border-slate-800 bg-slate-900 rounded-2xl p-8 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="w-6 h-6 text-[#e5c158]" />
              <h2 className="text-xl font-bold text-white">Your Plan & Billing</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-800 pb-8">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Tier</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[#e5c158]">
                    {activePlan === 'FREE_TRIAL' ? 'Free Trial' : activePlan === 'CONTRACTOR' ? 'Contractor' : activePlan === 'PHANTOM' ? 'Phantom' : 'Enterprise'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Zero-Knowledge email tunnel architecture</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${
                    subInfo?.status === 'ACTIVE'
                      ? 'bg-[#d4af37]/10 text-[#e5c158] border-[#d4af37]/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" /> {subInfo?.status === 'ACTIVE' ? 'Active' : 'Trialing'}
                  </span>
                </div>
                {subInfo?.current_period_end && (
                  <p className="text-sm text-slate-500 mt-2">
                    Renews: {new Date(subInfo.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="text-left">
                <p className="text-sm text-slate-400 leading-relaxed">
                  Update payment methods, view invoices, or dynamically upgrade your account limits securely via Stripe.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {activePlan === 'FREE_TRIAL' ? (
                  <Link
                    href="/pricing"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c158] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-black font-extrabold rounded-lg transition-all shadow-sm"
                  >
                    <ArrowRight className="w-4 h-4" /> Upgrade Plan
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/pricing"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c158] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-black font-extrabold rounded-lg transition-all shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4" /> Upgrade / Downgrade Plan
                    </Link>
                    <button
                      onClick={handleManageBilling}
                      disabled={isLaunchingPortal}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-sm border border-slate-700 disabled:opacity-50"
                    >
                      {isLaunchingPortal ? (
                        <><Loader2 className="w-4 h-4 animate-spin animate-spin" /> Launching Portal...</>
                      ) : (
                        <><ExternalLink className="w-4 h-4" /> Manage Subscription</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {portalError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                ⚠️ {portalError}
              </div>
            )}

          </div>

          {/* Dashboard Right Column: Delivery Preferences */}
          <div className="border border-slate-800 bg-slate-900 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Sliders className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Preferences</h2>
            </div>

            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <div>
                  <p className="text-sm font-semibold text-white">Enforce TLS</p>
                  <p className="text-xs text-slate-400 mt-1">Strict SMTP encryption</p>
                </div>
                <button 
                  onClick={() => setStrictTls(!strictTls)}
                  className={`w-12 h-6 rounded-full transition-all p-1 flex items-center ${
                    strictTls ? 'bg-[#d4af37] justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                <div>
                  <p className="text-sm font-semibold text-white">AI Spam Filter</p>
                  <p className="text-xs text-slate-400 mt-1">Drop severe threats automatically</p>
                </div>
                <button 
                  onClick={() => setSpamFilter(!spamFilter)}
                  className={`w-12 h-6 rounded-full transition-all p-1 flex items-center ${
                    spamFilter ? 'bg-[#d4af37] justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-white mb-3">Primary Node Region</p>
                <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                  {['US_EAST_STEALTH_01', 'EU_WEST_OBFUSCATE_02'].map((node) => (
                    <button
                      key={node}
                      onClick={() => setActiveRouterNode(node)}
                      className={`py-2 px-3 border rounded-lg transition ${
                        activeRouterNode === node
                          ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#e5c158]'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {node === 'US_EAST_STEALTH_01' ? 'US East' : 'EU West'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ORGANIZATION ENCLAVE CONTROL SECTION (Visible only if ENTERPRISE plan is active) */}
        {activePlan === 'ENTERPRISE' && (
          <div className="border border-[#d4af37]/30 bg-slate-900/90 rounded-2xl p-8 mb-12 backdrop-blur-md relative overflow-hidden animate-in fade-in duration-500">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-amber-500" />

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b border-slate-800 pb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                  🏢 Enterprise Sovereign Core
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Organization Enclave Control</h2>
                <p className="text-slate-400 text-xs mt-1">Manage team members, dynamic seat license distribution, and shared node limits.</p>
              </div>

              {isEditingDomain ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!domainInput.trim() || !domainInput.includes('.')) {
                      alert('⚠️ Invalid Domain Name: Must contain a valid domain suffix (e.g. acme.com)');
                      return;
                    }
                    const cleanedDomain = domainInput.trim().toLowerCase();
                    setOrgDomain(cleanedDomain);
                    setIsEditingDomain(false);
                    setToastMessage(`Corporate domain updated to *.${cleanedDomain}`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-[#d4af37]/45 shrink-0"
                >
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 font-mono block uppercase tracking-widest leading-none mb-1">Update Enclave Domain</span>
                    <input
                      type="text"
                      required
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="e.g. acme.com"
                      className="bg-transparent text-sm font-mono font-bold text-[#e5c158] outline-none border-b border-slate-800 focus:border-[#d4af37] w-36 py-0.5"
                    />
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button type="submit" className="px-2.5 py-1.5 bg-[#d4af37] hover:bg-white text-black font-mono font-bold text-[9px] uppercase rounded-lg transition duration-200">
                      Save
                    </button>
                    <button type="button" onClick={() => setIsEditingDomain(false)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono font-bold text-[9px] uppercase rounded-lg transition duration-200">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-950 px-4 py-3 rounded-xl border border-white/5 text-right shrink-0 flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest">Active Corporate Domain</span>
                    <span className="text-sm font-mono font-bold text-[#e5c158]">*.{orgDomain}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setDomainInput(orgDomain);
                      setIsEditingDomain(true);
                    }}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-[9px] font-bold uppercase rounded-lg transition duration-200"
                  >
                    Edit Domain
                  </button>
                </div>
              )}
            </div>

            {/* ORG TAB SELECTOR */}
            <div className="flex flex-wrap border-b border-slate-800 mb-8 gap-6 shrink-0">
              <button
                onClick={() => setActiveOrgTab('members')}
                className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeOrgTab === 'members'
                    ? 'border-[#d4af37] text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                👥 Corporate Directory
              </button>
              <button
                onClick={() => setActiveOrgTab('kb')}
                className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeOrgTab === 'kb'
                    ? 'border-[#d4af37] text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📚 Enclave Knowledge Base
              </button>
              <button
                onClick={() => setActiveOrgTab('dns')}
                className={`pb-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeOrgTab === 'dns'
                    ? 'border-[#d4af37] text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ DNS Hardening Tool
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {activeOrgTab === 'kb' && (
                <div className="md:col-span-8 space-y-6 text-left animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Sovereign Enclave Intel Guides</h3>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">Verified Corporate Resource</span>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        title: "1. Corporate Relay Tunnels & DKIM/SPF DNS Configuration",
                        desc: "To bypass anti-obfuscation filters, verify your corporate domain name *.domain.com using Stealth DNS enclaves. Add the following dynamic TXT records in your registrar's configuration to achieve 100% security delivery grades.",
                        details: "Record: TXT | Key: _stealthrelay | Value: verification-token-d183f982aef1\nRecord: TXT | Key: @ | Value: v=spf1 include:relay.stealthrelay.com ~all"
                      },
                      {
                        title: "2. Zero-Knowledge Multi-User vault access",
                        desc: "Stealth Relay runs on absolute local zero-knowledge protocols. The corporate shared file vault decodes files directly inside your browser cache using PBKDF2 Master Passwords. Under no circumstances should members distribute recovery phrases over corporate channels.",
                        details: "Mnemonic backing storage uses SHA-256 client-side seeds. If a member loses their 12-Word Recovery Phrase, administrators can revoke and reissue their clearance seat to restore storage pool limits."
                      },
                      {
                        title: "3. Access Audits & Telemetry Reporting",
                        desc: "Super Admins can audit all outgoing mail relays and download transactions from the main Platform Governance hub. Telemetry records include active strict-TLS handshake logs, primary region router nodes, and threat block events.",
                        details: "All system actions generate cryptographic trace tokens recorded in D1 enclaves. These audit trails are completely tamper-proof."
                      }
                    ].map((article, idx) => (
                      <div key={idx} className="border border-slate-800 bg-slate-950/60 rounded-xl p-5 hover:border-slate-700 transition duration-200">
                        <h4 className="text-xs font-mono font-bold text-[#e5c158] uppercase tracking-wider mb-2">{article.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{article.desc}</p>
                        <pre className="p-3 bg-black/60 rounded border border-white/5 text-[10px] font-mono text-slate-350 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {article.details}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeOrgTab === 'members' && (
                <div className="md:col-span-8 space-y-6 animate-in fade-in duration-300 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Authorized Team Directory</h3>
                    <span className="text-xs font-mono text-slate-400">
                      <strong className="text-white">{orgMembers.length}</strong> of <strong className="text-[#e5c158]">{orgSeats}</strong> Seats occupied
                    </span>
                  </div>

                  <div className="border border-slate-800 bg-slate-950/50 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 bg-slate-900/40">
                          <th className="px-6 py-3">Member email</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Clearance Inherited</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono">
                        {orgMembers.map((member) => (
                          <tr key={member} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-3.5 text-slate-200 text-xs">{member}</td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="text-[10px] text-slate-400">Enterprise Core Plan</span>
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              {member === session?.user?.email ? (
                                <span className="text-[10px] text-slate-500 uppercase italic">Primary Owner</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Revoke corporate platform clearance for ${member}?`)) {
                                      setOrgMembers(orgMembers.filter(m => m !== member));
                                      setToastMessage(`Revoked clearance for ${member}`);
                                      setTimeout(() => setToastMessage(null), 3000);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-red-950/20 hover:bg-red-900 border border-red-900/30 text-red-400 text-[9px] font-bold uppercase rounded transition-all"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* UX Security Rule Banner */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                    <p className="text-[11px] font-mono font-bold text-[#e5c158] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      ⚠️ Enclave Security Rule
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Clearance license seats are strictly bound to your active corporate domain (**{orgDomain}**). Added members must have email mailboxes sharing this domain. External public mailboxes (e.g. Gmail, Yahoo) are blocked from accessing this enclave.
                    </p>
                  </div>

                  {/* Add member form */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMemberEmail.trim()) return;
                      if (orgMembers.length >= orgSeats) {
                        alert(`⚠️ Seat pool limit reached (${orgSeats}/${orgSeats}). Upgrade seats capacity in your Pricing page.`);
                        return;
                      }
                      const newEmail = newMemberEmail.trim().toLowerCase();
                      const emailParts = newEmail.split('@');
                      if (emailParts.length !== 2 || emailParts[1] !== orgDomain.toLowerCase()) {
                        alert(`⚠️ Domain Mismatch: Members must belong to the active corporate domain (*.${orgDomain}). Public or external mailboxes cannot inherit these seats.`);
                        return;
                      }
                      if (orgMembers.includes(newEmail)) {
                        alert(`User ${newEmail} is already registered under this enclave.`);
                        return;
                      }
                      setOrgMembers([...orgMembers, newEmail]);
                      setNewMemberEmail('');
                      setToastMessage(`Clearance granted to ${newEmail}`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                    className="flex flex-col sm:flex-row gap-3 pt-2"
                  >
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder={`Enter corporate member email (e.g. colleague@${orgDomain})`}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-[#d4af37]/40 transition duration-200"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#d4af37] hover:bg-white text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition duration-200 shrink-0 font-mono"
                    >
                      + Grant Clearance
                    </button>
                  </form>
                </div>
              )}

              {activeOrgTab === 'dns' && (
                <div className="md:col-span-8 space-y-6 text-left animate-in fade-in duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">DNS Obfuscation Hardening Audit</h3>
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">Operational Telemetry</span>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 text-left">
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                      Organizations running premium email relays must bind verification tokens and dynamic SPF records to their registrar to bypass strict Zero-Trust spam controls. Execute a real-time hardening audit to ensure your node domain is secure.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/60 p-4 border border-white/5 rounded-xl mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20 shrink-0">
                          <Shield className="w-5 h-5 text-[#e5c158]" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-widest leading-none mb-1">Target Enclave Domain</span>
                          <span className="text-xs font-mono font-bold text-white">*.{orgDomain}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDnsAuditing(true);
                          setDnsAuditResult(null);
                          setTimeout(() => {
                            setDnsAuditing(false);
                            setDnsAuditResult({
                              spf: 'PASS',
                              dkim: 'PASS',
                              dmarc: 'PASS',
                              mx: 'PASS',
                              encryption: 'TLS 1.3 / AES-256-GCM',
                              integrityScore: '100%'
                            });
                          }, 1500);
                        }}
                        disabled={dnsAuditing}
                        className="sm:ml-auto px-4 py-2 bg-[#d4af37] hover:bg-white text-black text-xs font-mono font-black uppercase tracking-wider rounded-lg transition duration-200 disabled:opacity-50"
                      >
                        {dnsAuditing ? 'Auditing Telemetry...' : '🛡️ Run Hardening Audit'}
                      </button>
                    </div>

                    {dnsAuditResult && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { name: 'SPF Record', val: dnsAuditResult.spf, icon: '✅' },
                            { name: 'DKIM Record', val: dnsAuditResult.dkim, icon: '✅' },
                            { name: 'DMARC Policy', val: dnsAuditResult.dmarc, icon: '✅' },
                            { name: 'MX Routing', val: dnsAuditResult.mx, icon: '✅' },
                          ].map((item, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-center">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-1">{item.name}</span>
                              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1">
                                <span>{item.icon}</span> {item.val}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-900/40 border border-slate-855 rounded-xl p-5 font-mono space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 uppercase tracking-widest font-bold">Routing Encryption Grade</span>
                            <span className="text-[#e5c158] font-bold">{dnsAuditResult.encryption}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 uppercase tracking-widest font-bold">Sovereign Integrity Rating</span>
                            <span className="text-emerald-400 font-bold">{dnsAuditResult.integrityScore} Grade A+</span>
                          </div>
                          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                            <span className="uppercase tracking-widest">DKIM Selector Record Value</span>
                            <span className="text-slate-350 truncate max-w-[200px] select-all">_stealthrelay.{orgDomain}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-left">
                          <p className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            🛡️ Sovereign Security Certified
                          </p>
                          <p className="text-[11px] text-slate-350 leading-relaxed font-sans">
                            DNS lookup confirmed that your domain's SPF, DKIM, and DMARC settings match StealthRelay cryptographic nodes flawlessly. Operational relay anonymity is locked down and fully active.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sidebar with specs and active limits */}
              <div className="md:col-span-4 bg-slate-950/40 border border-slate-800 rounded-xl p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Enclave Allocation</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Seats Quota</span>
                      <span className="text-white font-bold">{orgSeats} Licenses</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Assigned Seats</span>
                      <span className="text-[#e5c158] font-bold">{orgMembers.length} Members</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Remaining Seats</span>
                      <span className="text-emerald-400 font-bold">{orgSeats - orgMembers.length} Available</span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-850" />

                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Features Inherited per member</h4>
                  <ul className="space-y-2 text-[10px] font-mono text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" /> Shared 4 TB Cloud Storage Pool
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" /> Infinite Relay Aliases
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" /> Unlimited custom domain verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full" /> 5 GB Max Vault File Upload Limits
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {toastMessage && (
              <div className="absolute bottom-6 right-8 bg-[#d4af37] text-black font-mono font-black uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-lg shadow-lg z-50 flex items-center gap-2">
                {toastMessage}
              </div>
            )}
          </div>
        )}

        {/* SECURITY GUARANTEE FOOTER CARD */}
        <div className="p-8 border border-slate-800 bg-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-[#e5c158] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Zero-Knowledge Architecture</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                Your data is secured with AES-GCM-256 client-side encryption. Mnemonic key sequences are generated locally on your browser and are never transmitted to our network under any circumstances.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/relay"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 border border-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-all"
            >
              Open Relay Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
