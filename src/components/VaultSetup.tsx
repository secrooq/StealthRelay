'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Key, CheckCircle2, Loader2, Download, ChevronRight, AlertTriangle, Copy, Lock } from 'lucide-react';
import type { WorkerMessage, WorkerResponse } from '../workers/securityEngine.worker';
import { useVault } from './VaultProvider';

export default function VaultSetup({ onComplete }: { onComplete: () => void }) {
  const { setVaultKey } = useVault();
  
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Warning/Mnemonic, 2: Password, 3: Done
  const [mnemonic, setMnemonic] = useState<string>('');
  const [saltStr, setSaltStr] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backedUp, setBackedUp] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // 1. Set up Worker
    workerRef.current = new Worker(new URL('../workers/securityEngine.worker.ts', import.meta.url));
    
    workerRef.current.onerror = (err) => {
      console.error("Worker crash:", err);
      setError("Critical Security Engine crash: " + err.message);
    };

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === 'MNEMONIC_RESULT') {
        setMnemonic(data.mnemonic);
      } else if (data.type === 'VAULT_INIT_RESULT') {
        handleBackendRegistration(data);
      } else if (data.type === 'ERROR') {
        setError(data.message);
        setIsProcessing(false);
      }
    };

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    setSaltStr(btoa(String.fromCharCode(...salt)));

    // Generate Mnemonic
    workerRef.current.postMessage({ type: 'VAULT_GENERATE_MNEMONIC' });

    return () => workerRef.current?.terminate();
  }, []);

  const handleDownloadBackup = () => {
    const blob = new Blob([`STEALTHBOX RECOVERY KEY\n\nKeep this safe. Anyone with this key can access your vault.\n\nRecovery Mnemonic:\n${mnemonic}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'StealthBox_Recovery_Key.txt';
    a.click();
    URL.revokeObjectURL(url);
    setBackedUp(true);
    setError(null);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setBackedUp(true);
    setError(null);
  };

  const startInitialization = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsProcessing(true);
    workerRef.current?.postMessage({
      type: 'VAULT_INITIALIZE',
      password,
      mnemonic,
      saltStr
    } as WorkerMessage);
  };

  const handleBackendRegistration = async (initData: any) => {
    try {
      const res = await fetch('/api/vault/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salt: initData.salt,
          wrapped_vault_key_pwd: initData.wrappedKeyPwd.key,
          iv_pwd: initData.wrappedKeyPwd.iv,
          wrapped_vault_key_rec: initData.wrappedKeyRec.key,
          iv_rec: initData.wrappedKeyRec.iv
        })
      });

      if (!res.ok) throw new Error("Failed to sync credentials to secured cloud storage.");

      // Success! Store the decrypted key in our state hook directly
      setVaultKey(initData.rawVaultKeyBase64);
      setStep(3);
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#070709]/85 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500 text-center font-mono relative overflow-hidden">
      {/* Tactical reticle markers */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />

      {step === 1 && (
        <div className="space-y-6">
          <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto border border-[#d4af37]/20 mb-2">
            <ShieldAlert className="w-10 h-10 text-[#e5c158]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Initialize StealthBox</h2>
          <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed uppercase tracking-wider">
            Since this is zero-knowledge, we cannot recover your files if you forget your password. We have generated an <span className="text-[#e5c158] font-bold">Emergency Recovery Mnemonic</span> for you.
          </p>
          
          <div className="p-6 bg-black/60 border border-white/10 rounded-2xl relative shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(mnemonic || '...').split(' ').map((word, idx) => (
                <div key={idx} className="flex text-xs font-mono items-center">
                  <span className="text-slate-600 mr-2 w-4 text-right">{idx + 1}.</span>
                  <span className="text-white font-bold uppercase tracking-wider">{word || '...'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleDownloadBackup}
              className="flex items-center justify-center px-6 py-3 bg-black/40 hover:bg-[#d4af37]/10 border border-white/10 hover:border-[#d4af37]/30 text-xs font-bold uppercase tracking-wider rounded-xl text-white hover:text-[#e5c158] transition-all"
            >
              <Download className="w-4 h-4 mr-2" /> Download File
            </button>
            <button 
              onClick={handleCopyToClipboard}
              className="flex items-center justify-center px-6 py-3 bg-black/40 hover:bg-[#d4af37]/10 border border-white/10 hover:border-[#d4af37]/30 text-xs font-bold uppercase tracking-wider rounded-xl text-white hover:text-[#e5c158] transition-all"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Text
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs uppercase tracking-wider flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 mr-2" /> 🚨 {error}
            </p>
          )}

          <button 
            onClick={() => backedUp ? setStep(2) : setError("You must backup the recovery phrase to continue.")}
            className={`w-full py-4 px-4 rounded-xl font-black transition-all flex items-center justify-center text-xs uppercase tracking-[0.2em] ${backedUp ? 'bg-[#d4af37] text-black hover:bg-[#e5c158]' : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5'}`}
          >
            I've Stored It Safely <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto border border-[#d4af37]/20 mb-2">
            <Key className="w-10 h-10 text-[#e5c158]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Set Master Password</h2>
          <p className="text-slate-400 text-xs max-w-sm mx-auto uppercase tracking-wider">
            This will lock your everyday usage. It never leaves your browser.
          </p>

          <div className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Create Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all font-mono text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all font-mono text-sm mt-1"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs uppercase tracking-wider flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 mr-2" /> 🚨 {error}
            </p>
          )}

          <button 
            onClick={startInitialization}
            disabled={isProcessing || !password}
            className="w-full bg-[#d4af37] hover:bg-[#e5c158] py-4 px-4 rounded-xl font-black text-black transition-all flex items-center justify-center shadow-lg text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-3 animate-spin text-black" /> Deriving Cryptography...</> : <><Lock className="w-5 h-5 mr-3" /> Finalize Vault</>}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Vault Armored!</h2>
          <p className="text-slate-400 text-xs uppercase tracking-wider leading-relaxed">Your zero-knowledge persistent file vault is now fully activated.</p>
          
          <button 
            onClick={onComplete}
            className="w-full bg-[#d4af37] hover:bg-[#e5c158] text-black hover:text-black py-4 px-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
