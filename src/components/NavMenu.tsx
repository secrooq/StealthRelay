'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Database, Mail, Lock, ChevronDown, Menu, X, ShieldAlert, LogOut, Shield, User, Home, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function NavMenu() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [subPlan, setSubPlan] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const authenticatedLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Shield },
    { name: 'Tactical Secret', href: '/secret', icon: Lock },
    { name: 'Secure Vault', href: '/vault', icon: Database },
    { name: 'Relay Grid', href: '/relay', icon: Mail },
  ];

  const handleSignOut = async () => {
    // Session termination securely cleans sessionStorage and returns user to home
    sessionStorage.removeItem('stealth_vault_key');
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/subscription')
        .then(res => res.json())
        .then(data => {
          setSubPlan(data.plan);
          setSubStatus(data.status);
        })
        .catch(err => console.error("NavMenu plan fetch failed:", err));
    }
  }, [status]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isSignedIn = status === 'authenticated';
  const isSignedOut = status === 'unauthenticated';

  return (
    <div className="w-full flex-1 md:flex-initial flex items-center justify-between">
      {/* MOBILE BAR (Visible on mobile only) */}
      <div className="flex md:hidden items-center justify-between w-full h-16 relative">
        {/* Left: Hamburger sign */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-200 hover:text-[#e5c158] transition focus:outline-none shrink-0 z-10"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Middle: Logo (centered) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link href="/" className="flex items-center gap-1.5 group pointer-events-auto">
            <div className="w-7.5 h-7.5 bg-[#d4af37]/10 border border-[#d4af37]/45 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.1)]">
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
            </div>
            <span className="font-sans font-black uppercase tracking-widest text-[11px] text-white">
              Stealth<span className="text-[#e5c158]">Relay</span>
            </span>
          </Link>
        </div>

        {/* Right: Sign In / Profile trigger */}
        <div className="flex items-center justify-end min-w-[40px] z-10">
          {isSignedOut && (
            <Link 
              href="/login" 
              className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white transition whitespace-nowrap px-2"
            >
              Sign In
            </Link>
          )}
          {isSignedIn && (
            <button 
              onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#e5c158] font-mono font-bold text-xs shadow-sm focus:outline-none"
            >
              {session?.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'}
            </button>
          )}
        </div>
      </div>

      {/* CENTER NAVIGATION (DESKTOP) */}
      <nav className="hidden md:flex items-center gap-8 flex-1 justify-center px-4">
        {isSignedIn && (
          <>
            {authenticatedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-[13px] font-mono uppercase tracking-wider transition-colors duration-200 ${
                  pathname === item.href ? 'text-[#e5c158]' : 'text-slate-100 hover:text-[#e5c158]'
                }`}
              >
                <item.icon className="w-4 h-4 text-[#d4af37]/80" />
                {item.name}
              </Link>
            ))}
          </>
        )}

        {isSignedOut && (
          <>
            {/* Product Dropdown */}
            <div className="relative group py-4">
              <button className="flex items-center gap-1 text-[13px] font-mono uppercase tracking-widest text-slate-100 hover:text-[#e5c158] transition-colors duration-200">
                Product <ChevronDown className="w-3 h-3 text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute top-full left-[-80px] mt-1 w-96 rounded-xl border border-neutral-850 bg-black/95 backdrop-blur-xl p-3 shadow-2xl transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 grid grid-cols-1 gap-1">
                <Link href="/products/relay" className="flex flex-col px-4 py-3 hover:bg-neutral-900/80 rounded-lg transition text-left group/item border border-transparent hover:border-white/5">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e5c158] group-hover/item:translate-x-1 transition-transform">⚡ StealthRelay</span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">Dynamic Email Masking &amp; Alias Ingestion</span>
                </Link>
                <Link href="/products/vault" className="flex flex-col px-4 py-3 hover:bg-neutral-900/80 rounded-lg transition text-left group/item border border-transparent hover:border-white/5">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e5c158] group-hover/item:translate-x-1 transition-transform">🔒 StealthVault</span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">Zero-Knowledge Cloud Archival Storage</span>
                </Link>
                <Link href="/products/share" className="flex flex-col px-4 py-3 hover:bg-neutral-900/80 rounded-lg transition text-left group/item border border-transparent hover:border-white/5">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#e5c158] group-hover/item:translate-x-1 transition-transform">⏳ StealthShare</span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1">One-Time Ephemeral Secret Transits</span>
                </Link>
                <div className="border-t border-neutral-850 my-1" />
                <Link href="/compare" className="flex flex-col px-4 py-3 hover:bg-[#d4af37]/5 rounded-lg transition text-left group/item border border-transparent hover:border-[#d4af37]/20">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-white group-hover/item:translate-x-1 transition-transform">🔄 Suite Compare</span>
                  <span className="text-[10px] text-[#e5c158]/80 font-mono uppercase tracking-wider mt-1">Consolidation Economics vs. 3 Legacy Tools</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Pricing */}
        <Link
          href="/pricing"
          className={`text-[13px] font-mono uppercase tracking-widest transition-colors duration-200 ${
            pathname === '/pricing' ? 'text-[#e5c158]' : 'text-slate-100 hover:text-[#e5c158]'
          }`}
        >
          Pricing
        </Link>
      </nav>

      {/* MOBILE LEFT HAND SIDE MENU (PRODUCTS & TACTICAL GUIDES) */}
      {isMobileMenuOpen && mounted && createPortal(
        <>
          {/* Backdrop (Common) */}
          <div 
            className="fixed inset-0 z-[98] bg-black/65 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-[99] w-80 max-w-full bg-[#0a0a0d] border-r border-[#d4af37]/20 flex flex-col justify-start animate-in slide-in-from-left duration-300 shadow-2xl overflow-y-auto">
            {/* Drawer Header matching cyberaeronautycs style */}
            <div className="flex justify-between items-center px-6 py-5 bg-[#0e0e12] border-b border-white/5 shrink-0">
              <span className="font-mono text-[10px] uppercase text-[#e5c158] font-black tracking-[0.25em]">SYSTEM CONSOLE</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="flex flex-col text-left">
              <div className="px-6 pt-6 pb-2 text-[9px] font-mono font-black text-[#e5c158] uppercase tracking-[0.25em]">
                PRODUCT SUITE
              </div>
              <Link 
                href="/products/relay" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 flex items-center gap-2 ${
                  pathname === '/products/relay' ? 'text-[#e5c158] bg-white/5' : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>⚡ StealthRelay Alias</span>
              </Link>
              <Link 
                href="/products/vault" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 flex items-center gap-2 ${
                  pathname === '/products/vault' ? 'text-[#e5c158] bg-white/5' : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>🔒 StealthVault Box</span>
              </Link>
              <Link 
                href="/products/share" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 flex items-center gap-2 ${
                  pathname === '/products/share' ? 'text-[#e5c158] bg-white/5' : 'text-slate-350 hover:text-white'
                }`}
              >
                <span>⏳ StealthShare Link</span>
              </Link>

              <div className="px-6 pt-6 pb-2 text-[9px] font-mono font-black text-[#e5c158] uppercase tracking-[0.25em]">
                TACTICAL GUIDES
              </div>
              <Link 
                href="/industries" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/industries' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                🌍 Who We Serve
              </Link>
              <Link 
                href="/compare" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/compare' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                🔄 Suite Compare
              </Link>
              <Link 
                href="/pricing" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/pricing' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                💳 Pricing Plans
              </Link>
              <Link 
                href="/faq" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/faq' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                📚 FAQ Docs
              </Link>
              <Link 
                href="/blog" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/blog' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                📰 Security Blog
              </Link>
              <Link 
                href="/legal" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 ${
                  pathname === '/legal' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                ⚖️ Legal Directives
              </Link>
            </div>

            {isSignedOut && (
              <div className="mt-auto p-6 bg-[#0e0e12] border-t border-white/5 flex flex-col gap-4">
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-full text-center py-3 bg-[#d4af37] hover:bg-[#e5c158] text-[#141310] font-mono font-bold uppercase tracking-widest rounded-xl text-xs transition duration-300 shadow-lg"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-full text-center py-3 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-white/10 font-mono font-bold uppercase tracking-widest rounded-xl text-xs transition duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      {/* MOBILE RIGHT HAND SIDE PROFILE DRAWER (OPERATIVE CONSOLE FOR LOGGED IN USERS) */}
      {isMobileProfileOpen && mounted && createPortal(
        <>
          {/* Backdrop (Common) */}
          <div 
            className="fixed inset-0 z-[98] bg-black/65 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileProfileOpen(false)}
          />
          
          <div className="md:hidden fixed top-0 right-0 bottom-0 z-[99] w-80 max-w-full bg-[#0a0a0d] border-l border-[#d4af37]/20 flex flex-col justify-start animate-in slide-in-from-right duration-300 shadow-2xl overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-5 bg-[#0e0e12] border-b border-white/5 shrink-0">
              <span className="font-mono text-[10px] uppercase text-[#e5c158] font-black tracking-[0.25em]">OPERATIVE CONSOLE</span>
              <button 
                onClick={() => setIsMobileProfileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Profile Card Info */}
            <div className="p-6 border-b border-white/5 bg-[#0e0e12]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#d4af37]/10 border border-[#d4af37]/35 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#d4af37]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-300 block truncate">
                    {session?.user?.email || 'Operative'}
                  </span>
                  {subPlan && (
                    <span className="inline-block text-[8px] font-mono font-black px-2 py-0.5 rounded border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#e5c158] uppercase tracking-[0.2em] mt-1">
                      PLAN: {subPlan === 'FREE_TRIAL' ? 'TRIAL' : subPlan}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Operative Console Links */}
            <div className="flex flex-col text-left">
              <div className="px-6 pt-6 pb-2 text-[9px] font-mono font-black text-[#e5c158] uppercase tracking-[0.25em]">
                SYSTEM CHANNELS
              </div>
              {authenticatedLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileProfileOpen(false)}
                  className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 flex items-center gap-3 ${
                    pathname === item.href ? 'text-[#e5c158] bg-white/5' : 'text-slate-350 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 text-[#d4af37]/80" />
                  {item.name}
                </Link>
              ))}
              
              <Link
                href="/settings"
                onClick={() => setIsMobileProfileOpen(false)}
                className={`px-6 py-4.5 text-xs font-mono font-bold uppercase tracking-widest border-b border-white/5 transition-all hover:bg-white/5 flex items-center gap-3 ${
                  pathname === '/settings' ? 'text-[#e5c158] bg-white/5' : 'text-slate-355 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 text-[#d4af37]/80" />
                Account Settings
              </Link>
            </div>

            {/* Sign Out Button */}
            <div className="mt-auto p-6 bg-[#0e0e12] border-t border-white/5">
              <button 
                onClick={() => { setIsMobileProfileOpen(false); handleSignOut(); }}
                className="w-full py-3.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 font-mono text-xs uppercase tracking-[0.25em] rounded-xl transition duration-300 font-bold"
              >
                TERMINATE SESSION
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* USER CONSOLE (DESKTOP) */}
      <div className="hidden md:flex items-center gap-4 min-w-[140px] justify-end relative">
        {isSignedOut && (
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-[13px] font-sans font-medium text-slate-300 hover:text-white transition whitespace-nowrap">
              Sign In
            </Link>
            <Link href="/login" className="px-5 py-2.5 bg-[#d4af37] text-[#141310] text-[13px] font-sans font-bold uppercase tracking-wider rounded-lg hover:bg-[#e5c158] transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
              Sign Up
            </Link>
          </div>
        )}
        {isSignedIn && (
          <div className="flex items-center gap-4">
            
            {/* Interactive User Button profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 text-sm font-sans font-medium text-slate-300 hover:text-white transition focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#e5c158] font-bold text-sm shadow-sm hover:bg-slate-700 transition duration-300">
                  {session.user?.email ? session.user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden lg:inline truncate max-w-[120px]">{session.user?.email}</span>
                {subStatus === 'EXPIRED' && (
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> EXPIRED
                  </span>
                )}
              </button>

              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-neutral-800 bg-black shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200 font-sans text-sm text-left">
                    
                    <div className="px-4 py-3 border-b border-neutral-800 mb-2">
                      <span className="text-slate-500 block text-xs mb-1">Signed in as</span>
                      <span className="text-slate-100 font-semibold block truncate">{session.user?.email}</span>
                      {subStatus === 'EXPIRED' && (
                        <div className="mt-2 bg-red-950/40 border border-red-900/40 p-2.5 rounded-lg text-[10px] font-mono text-red-300 leading-relaxed">
                          ACCOUNT LOCKED: subscription has expired. Operations are offline. Data deletion will begin within 3 days.
                        </div>
                      )}
                    </div>
 
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-900 text-slate-300 hover:text-white transition"
                    >
                      <span>Dashboard</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${
                        subPlan === 'PHANTOM'
                          ? 'bg-[#d4af37]/10 text-[#e5c158] border border-[#d4af37]/20'
                          : subPlan === 'ENTERPRISE'
                          ? 'bg-[#d4af37]/15 text-[#e5c158] border border-[#d4af37]/20'
                          : subPlan === 'CONTRACTOR'
                          ? 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {subPlan === 'FREE_TRIAL' ? 'TRIAL' : subPlan || 'TRIAL'}
                      </span>
                    </Link>
 
                    <Link 
                      href="/vault" 
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-900 text-slate-300 hover:text-white transition"
                    >
                      <span>Secure Vault</span>
                      <Database className="w-4 h-4 text-slate-500" />
                    </Link>
 
                    <Link 
                      href="/settings" 
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-neutral-900 text-slate-300 hover:text-white transition"
                    >
                      <span>Account Settings</span>
                      <User className="w-4 h-4 text-slate-500" />
                    </Link>
 
                    {subStatus === 'EXPIRED' && (
                      <Link 
                        href="/pricing" 
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition font-bold font-mono text-xs uppercase"
                      >
                        <span>Renew Subscription</span>
                        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                      </Link>
                    )}
 
                    <div className="border-t border-neutral-800 my-2" />

                    <button 
                      onClick={() => { setIsUserDropdownOpen(false); handleSignOut(); }}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition font-medium flex items-center justify-between"
                    >
                      <span>Sign Out</span>
                      <LogOut className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
