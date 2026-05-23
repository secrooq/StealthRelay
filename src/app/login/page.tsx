'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Shield, AlertTriangle, Loader2, Download, Copy, Check, Sparkles, Mail, Key } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import TurnstileWidget from '@/components/TurnstileWidget';

function LoginContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);
  
  // Safe relative path extraction and open-redirect verification
  const getSafeCallback = (url: string | null): string => {
    if (!url || url === '/' || url === '/relay') return '/dashboard';
    try {
      if (url.startsWith('/') && !url.startsWith('//')) {
        return url;
      }
      const parsed = new URL(url);
      if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
        return parsed.pathname + parsed.search;
      }
    } catch {
      // invalid URL structure, fallback to default safe path
    }
    return '/dashboard';
  };

  const callbackUrl = getSafeCallback(searchParams.get('callbackUrl'));

  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [magicSuccess, setMagicSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  // Zero-Knowledge Registration States
  const [mnemonic, setMnemonic] = useState('');
  const [saltStr, setSaltStr] = useState('');
  const [backedUp, setBackedUp] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef({ email, password, turnstileToken });
  const recoverySaltRef = useRef('');
  
  useEffect(() => {
    stateRef.current = { email, password, turnstileToken };
  }, [email, password, turnstileToken]);

  useEffect(() => {
    setTurnstileToken('');
    setError('');
  }, [mode]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../../workers/securityEngine.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (event: MessageEvent<any>) => {
      const data = event.data;
      if (data.type === 'MNEMONIC_RESULT') {
        if (mode === 'register') {
          setMnemonic(data.mnemonic);
        }
      } else if (data.type === 'VAULT_INIT_RESULT') {
        executeBackendRegistration(data);
      } else if (data.type === 'VAULT_UNLOCK_RESULT') {
        if (mode === 'recover') {
          workerRef.current?.postMessage({
            type: 'VAULT_REKEY',
            password: password,
            rawVaultKeyBase64: data.rawVaultKeyBase64,
            saltStr: recoverySaltRef.current
          });
        }
      } else if (data.type === 'VAULT_REKEY_RESULT') {
        if (mode === 'recover') {
          executeBackendRecovery(data);
        }
      } else if (data.type === 'ERROR') {
        setError(data.message || 'Cryptographic engine error during derivation.');
        setIsLoading(false);
      }
    };

    if (mode === 'register') {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      setSaltStr(btoa(String.fromCharCode(...salt)));
      workerRef.current.postMessage({ type: 'VAULT_GENERATE_MNEMONIC' });
    } else if (mode === 'recover') {
      setMnemonic('');
      setSaltStr('');
    }

    return () => workerRef.current?.terminate();
  }, [mode]);

  const handleDownloadBackup = () => {
    const blob = new Blob([
      `STEALTHRELAY RECOVERY KEY\n\nKeep this secure. Anyone with this key can decrypt your secure vaults.\n\nRecovery Mnemonic:\n${mnemonic}`
    ], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StealthRelay_Recovery_Key.txt';
    a.click();
    URL.revokeObjectURL(url);
    setBackedUp(true);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setBackedUp(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (!turnstileToken) {
      setError('Anti-spam validation is required. Please verify the Turnstile widget.');
      return;
    }

    setIsLoading(true);
    setError('');

    if (mode === 'recover') {
      if (password.length < 8) {
        setError('New Master Passkey must be at least 8 characters long.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      if (!mnemonic.trim()) {
        setError('You must input your 12-Word Recovery Mnemonic.');
        setIsLoading(false);
        return;
      }

      try {
        const preRes = await fetch('/api/auth/pre-recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, turnstileToken })
        });

        const preData = await preRes.json();
        if (!preRes.ok) {
          throw new Error(preData.error || 'Failed to fetch recovery parameters.');
        }

        const { salt, wrapped_vault_key_rec, iv_rec } = preData;
        recoverySaltRef.current = salt;

        workerRef.current?.postMessage({
          type: 'VAULT_UNLOCK',
          input: mnemonic.trim(),
          saltStr: salt,
          wrappedKeyBase64: wrapped_vault_key_rec,
          ivBase64: iv_rec
        });
      } catch (err: any) {
        setError(err.message || 'Identity recovery handshaking failed.');
        setIsLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Master Password must be at least 8 characters long.');
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
      if (!backedUp) {
        setError('You must back up the Recovery Mnemonic to proceed.');
        setIsLoading(false);
        return;
      }

      workerRef.current?.postMessage({
        type: 'VAULT_INITIALIZE',
        password,
        mnemonic,
        saltStr
      });
    } else {
      try {
        if (!show2FAInput) {
          const checkRes = await fetch('/api/auth/pre-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const checkData = await checkRes.json();
          if (checkData.twoFactorEnabled) {
            setShow2FAInput(true);
            setIsLoading(false);
            return;
          }
        }

        const res = await signIn('credentials', {
          email,
          password,
          totp_code: totpCode,
          action: 'login',
          turnstile_token: turnstileToken,
          redirect: false,
        });

        if (res?.error) {
          if (res.error.includes("2FA_REQUIRED")) {
            setShow2FAInput(true);
            throw new Error("Two-factor authentication required.");
          }
          if (res.error.includes("INVALID_2FA_CODE")) {
            throw new Error("Invalid authenticator code.");
          }
          throw new Error(res.error || 'Invalid credentials.');
        }

        const plan = searchParams.get('plan');
        const billing = searchParams.get('billing') || 'monthly';

        if (plan) {
          window.location.href = `/api/stripe/checkout?plan=${plan}&billing=${billing}`;
        } else {
          window.location.href = callbackUrl;
        }
      } catch (err: any) {
        setError(err.message || 'Authentication failed.');
        setIsLoading(false);
      }
    }
  };

  const handleSendMagicLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    if (!turnstileToken) {
      setError("Anti-spam validation is required to request magic link.");
      return;
    }

    setIsLoading(true);
    setError('');
    setMagicSuccess(false);

    try {
      const res = await fetch('/api/auth/magic/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send link.");
      }
      setMagicSuccess(true);
      setError('');
    } catch (err: any) {
      setError(err.message || "Failed to send magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeBackendRegistration = async (initData: any) => {
    try {
      const { email: activeEmail, password: activePassword, turnstileToken: activeTurnstile } = stateRef.current;
      const res = await signIn('credentials', {
        email: activeEmail,
        password: activePassword,
        action: 'signup',
        salt: initData.salt,
        wrapped_pwd: initData.wrappedKeyPwd.key,
        iv_pwd: initData.wrappedKeyPwd.iv,
        wrapped_rec: initData.wrappedKeyRec.key,
        iv_rec: initData.wrappedKeyRec.iv,
        turnstile_token: activeTurnstile,
        redirect: false
      });

      if (res?.error) {
        throw new Error(res.error || 'Registration failed.');
      }

      sessionStorage.setItem('stealth_vault_key', initData.rawVaultKeyBase64);

      const plan = searchParams.get('plan');
      const billing = searchParams.get('billing') || 'monthly';

      if (plan) {
        window.location.href = `/api/stripe/checkout?plan=${plan}&billing=${billing}`;
      } else {
        window.location.href = '/dashboard?first_login=true';
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setIsLoading(false);
    }
  };

  const executeBackendRecovery = async (rekeyData: any) => {
    try {
      const { email: activeEmail, password: activePassword, turnstileToken: activeTurnstile } = stateRef.current;
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeEmail,
          newPassword: activePassword,
          wrappedKeyPwd: rekeyData.wrappedKeyPwd.key,
          ivPwd: rekeyData.wrappedKeyPwd.iv,
          turnstileToken: activeTurnstile
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Identity recovery failed.');
      }

      const signInRes = await signIn('credentials', {
        email: activeEmail,
        password: activePassword,
        action: 'login',
        turnstile_token: activeTurnstile,
        redirect: false
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error || 'Automatic sign-in failed. Please log in.');
      }

      window.location.href = callbackUrl;
    } catch (err: any) {
      setError(err.message || 'Identity recovery failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10 font-mono selection:bg-[#d4af37]/30 selection:text-white">
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
          SECURE CREDENTIAL INGRESS // UNIT {show2FAInput ? "2FA" : "Z-TRUST"}
        </p>
      </div>

      <div className="relative border border-white/10 bg-[#070709]/95 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.03)] overflow-hidden">
        {/* Tactical reticle markers */}
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37]/30" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37]/30" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37]/30" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37]/30" />
        
        {mode === 'recover' ? (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xs font-black text-[#e5c158] uppercase tracking-widest flex items-center gap-1.5">
              ⚙️ RE-KEY VECTOR
            </h2>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="text-[9px] text-slate-500 hover:text-white transition-all uppercase tracking-wider font-bold underline"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/60 rounded-md mb-8 border border-white/10">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                mode === 'login'
                  ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.25)] border border-[#d4af37]/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`py-2.5 text-xs font-mono font-bold uppercase tracking-wider rounded-sm transition-all ${
                mode === 'register'
                  ? 'bg-[#d4af37] text-black shadow-[0_0_15px_rgba(212,175,55,0.25)] border border-[#d4af37]/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              CREATE ID
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {searchParams.get('plan') && (
            <div className="p-3 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-md text-center mb-4">
              <span className="text-[9px] font-black text-[#e5c158] uppercase tracking-wider">
                DEPLOY LOADOUT: {searchParams.get('plan')} // {searchParams.get('billing') || 'monthly'}
              </span>
            </div>
          )}

          {/* Social SSO Section (at the top) */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl })}
                  className="py-2.5 px-4 bg-black/40 hover:bg-[#d4af37]/10 text-slate-300 hover:text-[#e5c158] border border-white/10 hover:border-[#d4af37]/30 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.48 0-6.3-2.82-6.3-6.3 0-3.48 2.82-6.3 6.3-6.3 1.625 0 3.01.61 4.07 1.629l3.117-3.116C19.314 2.766 16.07 1.5 12.24 1.5 6.442 1.5 1.74 6.202 1.74 12s4.702 10.5 10.5 10.5c5.787 0 10.395-4.088 10.395-10.5 0-.585-.058-1.215-.135-1.715H12.24z"/>
                  </svg>
                  Google SSO
                </button>
                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl })}
                  className="py-2.5 px-4 bg-black/40 hover:bg-[#d4af37]/10 text-slate-300 hover:text-[#e5c158] border border-white/10 hover:border-[#d4af37]/30 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub SSO
                </button>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative px-3 bg-[#070709] text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  OR INGRESS VIA MASTER CREDS
                </div>
              </div>
            </>
          )}
          
          {mode === 'recover' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  OPERATIVE EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operative@stealthrelay.com"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  12-WORD RECOVERY MNEMONIC
                </label>
                <textarea
                  required
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="word1 word2 word3..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium resize-none"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  NEW MASTER PASSKEY
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  CONFIRM NEW PASSKEY
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  OPERATIVE EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operative@stealthrelay.com"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                  disabled={isLoading || show2FAInput}
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                  MASTER PASSKEY
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                  disabled={isLoading || show2FAInput}
                />
              </div>

              {show2FAInput && (
                <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-2">
                  <label className="block text-[9px] font-bold text-[#e5c158] mb-1.5 uppercase tracking-[0.15em] flex items-center gap-1.5">
                    <Key className="w-3 h-3" /> INPUT AUTHENTICATOR PIN
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-black/50 border border-[#d4af37]/40 text-[#e5c158] rounded-md px-4 py-3.5 text-center font-mono text-xl tracking-[0.2em] font-black focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    disabled={isLoading}
                  />
                  <div className="p-3 bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-md">
                    <p className="text-[8px] text-slate-400 font-mono leading-relaxed uppercase">
                      Device lost? Click the <span className="text-[#e5c158] font-bold">Tactical Comms</span> button in the bottom-right or transmit an email to <a href="mailto:info@stealthrelay.com" className="text-[#e5c158] hover:underline font-bold">info@stealthrelay.com</a> to request an admin bypass override.
                    </p>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.15em]">
                      CONFIRM PASSKEY
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/20 rounded-md px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-slate-700 font-mono font-medium"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Emergency Mnemonic (Zero Knowledge Generation) */}
                  <div className="border border-[#d4af37]/20 bg-black/60 rounded-xl p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 font-mono text-[7px] text-[#e5c158]/20 tracking-wider">
                      SEC_PHRASE_GEN_v1.0
                    </div>
                    <div className="flex items-center gap-2 text-[#e5c158] text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> RECOVERY TELEMETRY MNEMONIC
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono uppercase leading-relaxed">
                      Zero-Knowledge System: We cannot recover your master passkey. Document this phrase in a physical location.
                    </p>
                    
                    <div className="p-3 bg-black border border-white/5 rounded-md">
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                        {(mnemonic || '...').split(' ').map((word, idx) => (
                          <div key={idx} className="flex items-center text-[10px] bg-white/[0.02] border border-white/5 rounded px-2 py-1">
                            <span className="text-[#e5c158]/40 w-5 text-right mr-1.5 font-mono font-bold">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="text-slate-200 font-bold uppercase font-mono">{word}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        className="flex-1 py-2 bg-black hover:bg-[#d4af37]/10 text-white hover:text-[#e5c158] hover:border-[#d4af37]/30 rounded-md border border-white/10 text-[9px] font-bold tracking-wider uppercase transition-all"
                      >
                        Download TXT
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="flex-1 py-2 bg-black hover:bg-[#d4af37]/10 text-white hover:text-[#e5c158] hover:border-[#d4af37]/30 rounded-md border border-white/10 text-[9px] font-bold tracking-wider uppercase transition-all"
                      >
                        Copy Phrase
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Anti-Spam Perimeter Verification */}
          <TurnstileWidget key={mode} onVerify={setTurnstileToken} />

          {error && (
            <div className="flex items-start gap-3 bg-red-955/20 border border-red-500/30 text-red-400 p-4 rounded-md text-xs font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                🚨 CRITICAL: {error}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#d4af37] hover:bg-[#e5c158] text-black font-mono font-black uppercase tracking-[0.2em] rounded-md transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> DERIVING QUANTUM ENVELOPE...
              </>
            ) : mode === 'login' ? (
              'AUTHORIZE ACCESS'
            ) : mode === 'recover' ? (
              'RESTORE & RE-KEY IDENTITY'
            ) : (
              'INITIALIZE SECURE VAULT'
            )}
          </button>

          {mode === 'login' && !show2FAInput && (
            <>
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={isLoading}
                className="w-full py-3 bg-black border border-white/10 text-slate-400 hover:text-[#e5c158] hover:bg-[#d4af37]/5 hover:border-[#d4af37]/30 rounded-md text-[10px] font-mono uppercase tracking-[0.15em] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" /> INSTANT MAG-LINK ROUTE
              </button>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('recover'); setError(''); }}
                  className="text-[9px] text-slate-500 hover:text-[#e5c158] transition-all uppercase tracking-wider font-bold"
                >
                  Forgot Passkey? Recover Identity
                </button>
              </div>
            </>
          )}

          {magicSuccess && (
            <div className="mt-4 p-4 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-xl flex items-start gap-3 animate-in fade-in duration-300">
              <Check className="w-4 h-4 text-[#e5c158] shrink-0 mt-0.5" />
              <div className="font-mono text-xs text-slate-300">
                <span className="text-[#e5c158] font-bold block uppercase tracking-wider mb-1">Link Transmitted</span>
                <span className="text-slate-400 text-[9px] uppercase leading-normal block">
                  Operative link routed. Access your mailbox vector to authorize instantly.
                </span>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="text-center mt-6">
        <p className="text-[9px] text-slate-600 font-mono uppercase leading-relaxed tracking-wider">
          ZERO-KNOWLEDGE ARCHITECTURE. <br />
          CRYPTOGRAPHIC ROOTS DERIVED LOCALLY // RAW SECRETS ARE EPHEMERAL.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#020203] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Immersive Cyberpunk Telemetry Grid & Blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] border border-[#d4af37]/[0.025] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(212,175,55,0.015),transparent_70%)] pointer-events-none" />
      
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center font-mono">
          <Loader2 className="w-10 h-10 text-[#e5c158] animate-spin mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#e5c158]">LOADING SECURE NODE INTERFACE...</p>
        </div>
      }>
        <LoginContainer />
      </Suspense>
    </div>
  );
}
