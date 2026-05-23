'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Copy, 
  Check, 
  Trash2, 
  Power, 
  Plus,
  Loader2,
  RefreshCw,
  Activity,
  AlertCircle,
  Layers,
  Lock,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Sparkles,
  Search
} from 'lucide-react';

interface Alias {
  id: string;
  alias_address: string;
  destination_email: string;
  label: string;
  is_active: number;
  forward_count: number;
  created_at: string;
  encryption_enabled?: number;
  pgp_public_key?: string;
}

interface Mailbox {
  id: string;
  email: string;
  is_verified: number;
  created_at: string;
  verification_token?: string;
}

export function RelayDashboard() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('FREE_TRIAL');
  
  // Mailbox State
  const [showMailboxMgr, setShowMailboxMgr] = useState(false);
  const [newMailboxInput, setNewMailboxInput] = useState('');
  const [isAddingMailbox, setIsAddingMailbox] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState('');
  const [mailboxMessage, setMailboxMessage] = useState<string | null>(null);

  // Custom Domains State
  const [customDomains, setCustomDomains] = useState<any[]>([]);
  const [isRegisteringDomain, setIsRegisteringDomain] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('stealthrelay.com');
  const [showDomainMgr, setShowDomainMgr] = useState(false);

  // UI State for expanding panels
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSavingCrypto, setIsSavingCrypto] = useState<string | null>(null);
  
  // Lock Status
  const [isLocked, setIsLocked] = useState(false);

  // AI Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);

  const fetchAliases = async () => {
    try {
      const res = await fetch('/api/relay');
      const data = await res.json();
      if (res.status === 403 && data.locked) {
        setIsLocked(true);
      } else if (data.aliases) {
        setAliases(data.aliases);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMailboxes = async () => {
    try {
      const res = await fetch('/api/mailboxes');
      const data = await res.json();
      if (data.mailboxes) {
        setMailboxes(data.mailboxes);
        // Auto select first verified if none selected yet
        const verified = data.mailboxes.find((m: any) => m.is_verified === 1);
        if (verified && !selectedMailbox) {
          setSelectedMailbox(verified.email);
        }
      }
    } catch (err) {
      console.error('Mailbox fetch error:', err);
    }
  };

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/relay/domains');
      const data = await res.json();
      if (data.domains) {
        setCustomDomains(data.domains);
      }
    } catch (err) {
      console.error('Domains fetch error:', err);
    }
  };

  const handleRegisterDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    setIsRegisteringDomain(true);
    setDomainMessage(null);
    try {
      const response = await fetch('/api/relay/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainName: newDomainInput }),
      });
      const data = await response.json();
      
      if (response.status === 403 && data.locked) {
        setIsLocked(true);
        return;
      }

      if (data.success) {
         setNewDomainInput('');
         setDomainMessage(`Custom domain "${data.domain.domain_name}" added successfully.`);
         fetchDomains();
      } else {
         setDomainMessage(`Error: ${data.error}`);
      }
    } catch (err) {
       setDomainMessage("Action Failed: Domain registration error.");
    } finally {
       setIsRegisteringDomain(false);
    }
  };

  const handleVerifyDomain = async (id: string) => {
    setVerifyingId(id);
    setDomainMessage(null);
    try {
      const response = await fetch(`/api/relay/domains/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      const data = await response.json();
      
      if (data.success && data.verified) {
         setDomainMessage(`Domain verified successfully!`);
         fetchDomains();
      } else {
         setDomainMessage(data.error || `Verification failed. Please double check DNS settings.`);
      }
    } catch (err) {
       setDomainMessage("Action Failed: Verification request error.");
    } finally {
       setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom domain? All secure aliases created using this domain suffix will be deleted permanently.')) return;
    try {
      const response = await fetch(`/api/relay/domains/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
         setDomainMessage(`Domain deleted successfully.`);
         fetchDomains();
         fetchAliases(); // Refresh aliases list since associated ones were deleted
      }
    } catch (err) {
       console.error("Failed to delete domain:", err);
    }
  };

  useEffect(() => {
    fetchAliases();
    fetchMailboxes();
    fetchDomains();

    // Fetch plan status
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.plan) {
          setUserPlan(data.plan);
        }
      })
      .catch(err => console.error("Failed to load plan", err));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedIds(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const itemsToSearch = aliases.map(alias => ({
          id: alias.id,
          alias_email: alias.alias_address,
          destination: alias.destination_email,
          notes: alias.label,
          is_active: alias.is_active,
          created_at: alias.created_at
        }));

        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            items: itemsToSearch,
            type: 'relay'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setMatchedIds(data.matchedIds || []);
        }
      } catch (err) {
        console.error("AI search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, aliases]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMailboxInput.includes('@')) return;
    setIsAddingMailbox(true);
    setMailboxMessage(null);
    try {
      const response = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMailboxInput }),
      });
      const data = await response.json();
      
      if (response.status === 403 && data.locked) {
        setIsLocked(true);
        return;
      }

      if (data.success) {
         setNewMailboxInput('');
         // Show clear confirmation
         setMailboxMessage(`Secondary email added successfully.`);
         fetchMailboxes();
      } else {
         setMailboxMessage(`Error: ${data.error}`);
      }
    } catch (err) {
       setMailboxMessage("Action Failed: Service communication error.");
    } finally {
       setIsAddingMailbox(false);
    }
  };

  const getPlanDetails = () => {
    switch (userPlan) {
      case 'CONTRACTOR':
        return { name: 'Private Contractor', maxAliases: 10000, label: 'Unlimited Active Aliases' };
      case 'PHANTOM':
        return { name: 'Phantom Entity', maxAliases: 10000, label: 'Unlimited Active Aliases' };
      case 'ENTERPRISE':
        return { name: 'Enterprise Core', maxAliases: 10000, label: 'Unlimited Active Aliases' };
      case 'FREE_TRIAL':
      default:
        return { name: 'Free Trial', maxAliases: 5, label: '5 Active Aliases' };
    }
  };

  const planDetails = getPlanDetails();
  const maxAliasesVal = planDetails.maxAliases;
  const isLimitReached = aliases.length >= maxAliasesVal;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aliases.length >= maxAliasesVal) {
      alert(`You have reached the maximum allowance of ${maxAliasesVal >= 10000 ? 'Unlimited' : maxAliasesVal} secure aliases.`);
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          label: labelInput.trim() || 'Web Subscription',
          destinationEmail: selectedMailbox || undefined, // Let backend default to primary if empty
          domain: selectedDomain || 'stealthrelay.com'
        }),
      });
      const data = await response.json();

      if (response.status === 403 && data.locked) {
        setIsLocked(true);
        return;
      }

      if (data.success) {
        setLabelInput('');
        fetchAliases();
      } else {
         alert(data.error);
      }
    } catch (err) {
      console.error('Creation failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setAliases(prev => prev.map(a => a.id === id ? { ...a, is_active: newStatus } : a));
    
    try {
      const res = await fetch(`/api/relay/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.status === 403) { setIsLocked(true); return; }
      if (!res.ok) throw new Error();
    } catch (err) {
      setAliases(prev => prev.map(a => a.id === id ? { ...a, is_active: currentStatus } : a));
    }
  };

  const updateCryptoConfig = async (id: string, enabled: number, publicKey: string) => {
    setIsSavingCrypto(id);
    try {
      const res = await fetch(`/api/relay/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          encryption_enabled: enabled, 
          pgp_public_key: publicKey 
        }),
      });
      if (res.status === 403) { setIsLocked(true); return; }
      if (res.ok) {
        setAliases(prev => prev.map(a => a.id === id ? { ...a, encryption_enabled: enabled, pgp_public_key: publicKey } : a));
      }
    } catch (err) {
      console.error('Crypto save failed', err);
    } finally {
      setIsSavingCrypto(null);
    }
  };

  const burnAlias = async (id: string) => {
    if (!confirm('Are you sure you want to permanently burn this alias? All incoming traffic will be dropped forever.')) return;
    setAliases(prev => prev.filter(a => a.id !== id));
    
    try {
      const res = await fetch(`/api/relay/${id}`, {
        method: 'DELETE'
      });
      if (res.status === 403) { setIsLocked(true); return; }
      if (!res.ok) throw new Error();
    } catch (err) {
      fetchAliases();
    }
  };


  const displayedAliases = matchedIds === null 
    ? aliases 
    : matchedIds.map(id => aliases.find(a => String(a.id) === String(id))).filter(Boolean) as Alias[];



  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      
      {isLocked && (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#0a0a0c] border border-red-900/50 rounded-lg p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.1)]">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-mono font-bold text-white uppercase tracking-widest mb-2">Account Locked</h2>
            <p className="text-xs text-slate-200 font-mono leading-relaxed mb-8">
              Your account operations are currently locked due to an inactive or expired subscription. Please upgrade your plan to resume operations.
            </p>
            <a 
              href="/pricing" 
              className="block w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-sm uppercase tracking-widest rounded transition-all"
            >
              Renew Subscription
            </a>
          </div>
        </div>
      )}

      {!isLocked && (
        <>
      {/* Header Section */}
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12 bg-[#1a1815]/95 border border-[#d4af37]/15 p-8 rounded-2xl shadow-xl">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase">
              StealthRelay Dashboard
            </h1>
            <span className="bg-[#d4af37]/10 text-[#e5c158] border border-[#d4af37]/25 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide">{planDetails.name}</span>
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-2 font-medium">
            <Shield className="w-4.5 h-4.5 text-[#e5c158]" /> End-to-end secure email routing & identity masking.
          </p>
          
          {/* Capacity Counter & Mailbox Toggle */}
          <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="w-5 h-5 text-slate-500" />
                <span className="text-slate-200 font-bold">{aliases.length}</span>
                <span className="text-slate-500">/</span>
                <span className="text-[#e5c158]">{maxAliasesVal >= 10000 ? '∞' : maxAliasesVal} Active Aliases</span>
              </div>
              <button
                onClick={() => setShowMailboxMgr(!showMailboxMgr)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  showMailboxMgr ? 'bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#e5c158]' : 'bg-[#24211c] border border-[#d4af37]/15 text-slate-300 hover:text-white hover:bg-[#322d26]'
                }`}
              >
                <Activity className="w-4 h-4" />
                Manage Secondary Mailboxes
              </button>
           </div>
          </div>

        {/* New Fabrication Module with Dest Picker */}
        <form onSubmit={handleCreate} className="bg-[#0d0c0a]/60 border border-[#d4af37]/15 p-6 rounded-xl w-full lg:w-[400px]">
          <div className="text-sm font-mono font-bold text-[#e5c158] mb-5 flex items-center gap-2 uppercase tracking-wider">
            <Plus className="w-4 h-4" /> Create Secure Alias
          </div>
          
          <div className="space-y-5">
            <div>
               <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Label / Description</label>
               <input 
                 type="text"
                 placeholder="e.g. Netflix Subscription"
                 value={labelInput}
                 onChange={(e) => setLabelInput(e.target.value)}
                 disabled={isLimitReached}
                 className="bg-slate-900 border border-[#d4af37]/15 rounded-lg px-4 py-3 text-slate-250 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] transition w-full disabled:opacity-50 text-sm placeholder:text-slate-600"
               />
            </div>

             <div>
               <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Destination Routing</label>
               <select 
                 value={selectedMailbox}
                 onChange={(e) => setSelectedMailbox(e.target.value)}
                 className="bg-slate-900 border border-[#d4af37]/15 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] transition w-full text-sm font-mono"
               >
                 <option value="" className="bg-slate-900 text-slate-200">Default Account Email</option>
                 {mailboxes.filter(m => m.is_verified === 1).map(m => (
                   <option key={m.id} value={m.email} className="bg-slate-900 text-slate-200">{m.email}</option>
                 ))}
               </select>
                <p className="text-xs text-slate-500 mt-2 flex flex-col gap-1.5 leading-relaxed">
                  <span className="flex gap-1.5 items-center text-[#e5c158] cursor-pointer hover:text-[#d4af37] transition-all font-bold"
                        onClick={() => {
                          setShowMailboxMgr(true);
                          setTimeout(() => {
                            document.getElementById('fleet-control-matrix')?.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}>
                    <Activity className="w-3.5 h-3.5" /> Add Secondary Email
                  </span>
                  Route this alias to a secondary verified mailbox.
                </p>
            </div>

            <div>
               <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Domain Routing Suffix</label>
               <select 
                 value={selectedDomain}
                 onChange={(e) => setSelectedDomain(e.target.value)}
                 className="bg-slate-900 border border-[#d4af37]/15 rounded-lg px-4 py-3 text-slate-250 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/35 focus:border-[#d4af37] transition w-full text-sm font-mono"
               >
                 <option value="stealthrelay.com" className="bg-slate-900 text-slate-200">stealthrelay.com (System Default)</option>
                 {customDomains.filter(d => d.is_verified === 1).map(d => (
                   <option key={d.id} value={d.domain_name} className="bg-slate-900 text-slate-200">{d.domain_name}</option>
                 ))}
               </select>
               <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                 {userPlan === 'PHANTOM' || userPlan === 'ENTERPRISE' ? (
                   <span className="flex gap-1.5 items-center text-[#e5c158] cursor-pointer hover:text-[#d4af37] font-bold"
                         onClick={() => {
                           setShowDomainMgr(true);
                           setTimeout(() => {
                             document.getElementById('domain-control-matrix')?.scrollIntoView({ behavior: 'smooth' });
                           }, 150);
                         }}>
                     Manage Custom Domains
                   </span>
                 ) : (
                   "Custom Domain routing requires Phantom Entity or Enterprise Core."
                 )}
               </p>
            </div>

            <button
              type="submit"
              disabled={isCreating || isLimitReached}
              className="w-full mt-2 bg-[#d4af37] hover:bg-[#e5c158] text-[#141310] disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-50 px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {isCreating ? <Loader2 className="w-5 h-5 animate-spin text-[#141310]" /> : 'Generate Alias'}
            </button>
          </div>
        </form>
      </header>

      {/* Mailbox (Fleet) Management Grid Overlay */}
      {showMailboxMgr && (
        <div id="fleet-control-matrix" className="mb-10 bg-[#141310] border border-[#d4af37]/25 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4">
          <div className="bg-[#24211c]/60 px-8 py-5 border-b border-[#d4af37]/15 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <Activity className="text-[#e5c158] w-5 h-5" />
                <h2 className="text-sm font-mono font-black text-[#e5c158] uppercase tracking-[0.2em]">Linked Mailboxes</h2>
             </div>
             <button onClick={() => setShowMailboxMgr(false)} className="text-slate-350 hover:text-white font-mono text-xs uppercase tracking-wider font-bold">[Close]</button>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-10">
             <div>
               <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Link New Email</h3>
               <form onSubmit={handleAddMailbox} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="Enter your personal email address..." 
                      value={newMailboxInput}
                      onChange={(e) => setNewMailboxInput(e.target.value)}
                      className="w-full bg-white/[0.02] border border-[#d4af37]/15 rounded-xl px-4 py-3 font-mono text-sm text-white focus:ring-2 focus:ring-[#d4af37]/35 outline-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isAddingMailbox}
                    className="w-full py-2.5 border border-[#d4af37]/35 bg-[#d4af37]/5 hover:bg-[#d4af37]/10 rounded-xl text-[#e5c158] font-mono font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isAddingMailbox ? 'Adding Mailbox...' : 'Add Secondary Mailbox'}
                  </button>
                  {mailboxMessage && (
                    <div className={`text-[10px] font-mono p-3 rounded border ${mailboxMessage.includes('ERROR') ? 'border-red-500/20 bg-red-900/10 text-red-400' : 'border-emerald-500/20 bg-emerald-900/10 text-emerald-400'} break-all leading-relaxed`}>
                      {mailboxMessage}
                    </div>
                  )}
               </form>
             </div>

             <div>
               <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Mailbox Status</h3>
               <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {mailboxes.length === 0 ? (
                     <div className="text-xs font-mono text-slate-200 italic py-4 text-center">No secondary mailboxes linked. Utilizing primary account email.</div>
                  ) : (
                     mailboxes.map(mbox => (
                        <div key={mbox.id} className="space-y-1">
                          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                             <div className="font-mono text-xs truncate max-w-[200px] text-slate-100">{mbox.email}</div>
                             <div className={`text-[9px] font-bold px-2 py-1 rounded font-mono uppercase ${mbox.is_verified ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30' : 'bg-amber-900/30 text-amber-400 border border-amber-500/30 animate-pulse'}`}>
                                {mbox.is_verified ? 'ACTIVE' : 'PENDING'}
                             </div>
                          </div>
                          {!mbox.is_verified && (
                            <div className="text-[10px] text-amber-400/90 font-sans p-2 border border-amber-500/20 bg-amber-950/20 rounded-lg space-y-1.5">
                              <div className="flex items-start gap-1">
                                <span>⚠️ Check inbox for verification email.</span>
                              </div>
                              {mbox.verification_token && (
                                <a 
                                  href={`/api/verify/${mbox.verification_token}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block text-center underline text-[#e5c158] hover:text-[#d4af37] font-mono font-bold bg-black/40 px-2 py-1 rounded transition-colors"
                                >
                                  👉 Click Here to Verify Instantly
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                   )}
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Custom Domains Matrix Control Panel */}
      {showDomainMgr && (
        <div id="domain-control-matrix" className="mb-10 bg-[#141310] border border-[#d4af37]/25 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-top-4">
          <div className="bg-[#24211c]/60 px-8 py-5 border-b border-[#d4af37]/15 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <Shield className="text-[#e5c158] w-5 h-5" />
                <h2 className="text-sm font-mono font-black text-[#e5c158] uppercase tracking-[0.2em]">Custom Domain Matrix</h2>
             </div>
             <button onClick={() => setShowDomainMgr(false)} className="text-slate-350 hover:text-white font-mono text-xs uppercase tracking-wider font-bold">[Close]</button>
          </div>
          <div className="p-8 grid md:grid-cols-2 gap-10">
             <div>
               <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Connect Domain Vector</h3>
               <form onSubmit={handleRegisterDomain} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. secure.mybrand.com" 
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      className="w-full bg-white/[0.02] border border-[#d4af37]/15 rounded-xl px-4 py-3 font-mono text-sm text-white focus:ring-2 focus:ring-[#d4af37]/35 outline-none"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isRegisteringDomain}
                    className="w-full py-2.5 border border-[#d4af37]/35 bg-[#d4af37]/5 hover:bg-[#d4af37]/10 rounded-xl text-[#e5c158] font-mono font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isRegisteringDomain ? 'Registering...' : 'Add Custom Domain'}
                  </button>
                  {domainMessage && (
                    <div className="text-[10px] font-mono p-3 rounded border border-yellow-500/20 bg-yellow-900/10 text-yellow-400 break-all leading-relaxed">
                      {domainMessage}
                    </div>
                  )}
               </form>
               
               <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3.5 text-xs text-slate-400">
                 <h4 className="font-bold text-[#e5c158] uppercase tracking-wider text-[11px] font-mono">DNS CONFIGURATION PROTOCOL:</h4>
                 <div className="space-y-2">
                   <p className="leading-relaxed">
                     To route mail privately, configure these parameters at your domain registrar:
                   </p>
                   <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px] text-slate-300">
                     <li><strong>TXT Record:</strong> Name <code>@</code> or subdomain, Value: <code>stealthrelay-verification=YOUR_DOMAIN_ID</code></li>
                     <li><strong>MX Record 1:</strong> Name <code>@</code>, Server: <code>mx1.stealthrelay.com</code>, Priority: <code>10</code></li>
                     <li><strong>MX Record 2:</strong> Name <code>@</code>, Server: <code>mx2.stealthrelay.com</code>, Priority: <code>20</code></li>
                   </ul>
                 </div>
               </div>
             </div>

             <div>
               <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Active Domain Suffixes</h3>
               <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                  {customDomains.length === 0 ? (
                     <div className="text-xs font-mono text-slate-200 italic py-4 text-center">No custom domain vectors registered yet.</div>
                  ) : (
                     customDomains.map(dom => (
                        <div key={dom.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                           <div className="flex items-center justify-between">
                              <div className="font-mono text-xs truncate max-w-[200px] text-slate-100 font-bold">{dom.domain_name}</div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase ${dom.is_verified ? 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30' : 'bg-amber-900/30 text-amber-400 border border-amber-500/30'}`}>
                                   {dom.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                                </span>
                                <button 
                                  onClick={() => handleDeleteDomain(dom.id)}
                                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                  title="Delete Custom Domain Suffix"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                           </div>
                           
                           {!dom.is_verified && (
                             <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 space-y-2.5">
                               <div className="text-[10px] text-slate-400 font-mono select-all bg-black/40 p-2 rounded border border-white/5 truncate">
                                 Verification Token: <strong className="text-white text-[11px] block mt-1">stealthrelay-verification={dom.id}</strong>
                               </div>
                               <button 
                                 onClick={() => handleVerifyDomain(dom.id)}
                                 disabled={verifyingId === dom.id}
                                 className="w-full py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/35 text-[#e5c158] font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5"
                               >
                                 {verifyingId === dom.id ? (
                                   <Loader2 className="w-3 h-3 animate-spin" />
                                 ) : (
                                   'Verify TXT Record Now'
                                 )}
                               </button>
                             </div>
                           )}
                        </div>
                     ))
                  )}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-100">
          <RefreshCw className="w-8 h-8 animate-spin text-[#d4af37]" />
          <p className="font-mono text-sm tracking-widest font-bold">LOADING SettingsURE ALIASES...</p>
        </div>
      ) : aliases.length === 0 ? (
        <div 
          className="bg-[#1a1815]/80 border border-[#d4af37]/15 rounded-3xl p-12 text-center backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d4af37]/20">
            <Mail className="w-8 h-8 text-[#e5c158]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 uppercase">No Active Aliases Found</h3>
          <p className="text-slate-350 max-w-md mx-auto text-sm font-mono leading-relaxed font-bold">
            No active aliases. Create a new secure alias above to protect your real email.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Search Bar Overlay */}
          <div className="relative w-full max-w-xl mx-auto mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-5 h-5 text-[#e5c158] animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#e5c158]" />
              )}
            </div>
            <input 
              type="text"
              placeholder="AI Smart Search: 'Netflix account', 'aliases linked to work', 'inactive aliases'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0c0a]/90 border-2 border-[#d4af37]/15 focus:border-[#d4af37]/50 rounded-2xl pl-12 pr-6 py-4 text-sm font-sans text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-[#d4af37]/10 transition-all backdrop-blur-md shadow-lg shadow-black/50"
            />
          </div>

          {displayedAliases.length === 0 && matchedIds !== null && (
            <div className="bg-[#1a1815]/90 border border-[#d4af37]/15 rounded-3xl p-12 text-center backdrop-blur-xl">
              <Search className="w-8 h-8 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-mono text-slate-300 font-bold">No Semantic Matches Found</h3>
              <p className="text-xs text-slate-300 font-mono mt-2">Try broadening your search parameters or using direct keywords.</p>
            </div>
          )}

          <div className="grid gap-6">
            {displayedAliases.map((alias) => (
            <div
              key={alias.id}
              className={`group relative overflow-hidden bg-white/[0.02] border transition-all duration-500 backdrop-blur-xl rounded-2xl ${
                expandedId === alias.id ? 'ring-2 ring-[#d4af37]/50 border-transparent shadow-2xl' : alias.is_active ? 'border-[#d4af37]/15 hover:bg-white/[0.02]' : 'border-red-950/20 opacity-70'
              }`}
            >
              {/* Glow effect when expanded */}
              {expandedId === alias.id && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-[#e5c158]/5 pointer-events-none" />
              )}

              <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                {/* Left Icon */}
                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  alias.is_active 
                    ? alias.encryption_enabled ? 'bg-[#d4af37]/15 border-[#d4af37]/35 text-[#e5c158] shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {alias.encryption_enabled && alias.is_active ? <Lock className="w-5 h-5" /> : alias.is_active ? <Activity className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>

                {/* Info Area */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold text-white truncate tracking-tight font-sans">{alias.label}</span>
                    <div className="flex gap-2">
                      <span className="text-xs bg-white/5 text-slate-200 border border-white/10 px-2 py-0.5 rounded font-mono">
                        {alias.forward_count} EMAILS FORWARDED
                      </span>
                      {alias.encryption_enabled === 1 && (
                        <span className="text-[10px] font-bold text-[#e5c158] bg-[#d4af37]/10 border border-[#d4af37]/30 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 font-mono">
                          <Lock className="w-3 h-3" /> PGP ENCRYPTED
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative group/addr flex items-center">
                      <code className="font-mono text-[#e5c158] bg-[#0d0c0a]/80 px-3 py-1.5 rounded-lg border border-[#d4af37]/20 text-sm md:text-base select-all">
                        {alias.alias_address}
                      </code>
                      <button
                        onClick={() => handleCopy(alias.alias_address, alias.id)}
                        className="ml-2 p-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white rounded-lg transition-all"
                        title="Copy"
                      >
                        {copiedId === alias.id ? <Check className="w-4 h-4 text-[#4ade80]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Mail className="w-3 h-3 text-slate-200" /> Forwarding To: <span className="text-slate-100 font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{alias.destination_email}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end md:border-l border-white/5 md:pl-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === alias.id ? null : alias.id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all border ${
                        expandedId === alias.id 
                          ? 'bg-[#d4af37] text-[#141310] border-[#d4af37]' 
                          : 'bg-white/5 text-slate-100 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <KeyRound className="w-4 h-4" />
                      Settings
                      {expandedId === alias.id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </button>

                    <button
                      onClick={() => toggleStatus(alias.id, alias.is_active)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold font-mono uppercase text-xs tracking-widest transition-all border ${alias.is_active 
                        ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/20' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50'}`}
                    >
                      <Power className="w-4 h-4" />
                      <span className="hidden sm:inline">{alias.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => burnAlias(alias.id)}
                    className="p-2.5 text-slate-200 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all group-hover:text-slate-100"
                    title="Delete Permanently"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* EXPANDED CRYPTO PANEL */}
              {expandedId === alias.id && (
                <div className="border-t border-white/10 bg-black/40 p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* Left: The Toggle & Explain */}
                    <div className="w-full md:w-1/3 flex flex-col">
                      <div className="flex items-center gap-2 text-white font-mono font-black text-sm uppercase mb-2 tracking-widest">
                        <Lock className="w-5 h-5 text-cyan-400" /> PGP ENCRYPTION
                      </div>
                      <p className="text-xs text-slate-200 mb-6 leading-relaxed font-mono">
                        Encrypt all forwarded emails using asymmetric cryptography before they reach your mailbox. This ensures only you can read the emails, even if your mailbox provider is compromised.
                      </p>

                      <div className="mt-auto">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={alias.encryption_enabled === 1}
                            onChange={(e) => updateCryptoConfig(alias.id, e.target.checked ? 1 : 0, alias.pgp_public_key || '')}
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                          <span className="ml-3 text-xs font-bold font-mono text-slate-100 uppercase tracking-widest">
                            Enable PGP 
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Right: The Key Input */}
                    <div className="flex-grow flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <label className="text-xs text-slate-100 font-bold font-mono uppercase tracking-widest flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-slate-100" />
                          PGP PUBLIC KEY
                        </label>
                        {isSavingCrypto === alias.id && (
                          <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 animate-pulse uppercase">
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving Config...
                          </span>
                        )}
                      </div>
                      <textarea 
                        placeholder="-----BEGIN PGP PUBLIC KEY BLOCK----- ..."
                        defaultValue={alias.pgp_public_key || ''}
                        onBlur={(e) => {
                          if (e.target.value !== (alias.pgp_public_key || '')) {
                            updateCryptoConfig(alias.id, alias.encryption_enabled || 0, e.target.value);
                          }
                        }}
                        className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-cyan-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all resize-none placeholder:text-slate-500"
                      />
                      <div className="text-[9px] font-mono text-slate-200 text-right uppercase tracking-widest">
                        Auto-saves when clicking outside
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
