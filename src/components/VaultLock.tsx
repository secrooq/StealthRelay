'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Key, Unlock, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { WorkerMessage, WorkerResponse } from '../workers/securityEngine.worker';
import { useVault } from './VaultProvider';

type Profile = {
  salt: string;
  wrapped_vault_key_pwd: string;
  iv_pwd: string;
  wrapped_vault_key_rec: string;
  iv_rec: string;
};

export default function VaultLock({ profile }: { profile: Profile }) {
  const { setVaultKey } = useVault();
  const [mode, setMode] = useState<'password' | 'recovery'>('password');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/securityEngine.worker.ts', import.meta.url));
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      if (data.type === 'VAULT_UNLOCK_RESULT') {
        setIsProcessing(false);
        setVaultKey(data.rawVaultKeyBase64);
      } else if (data.type === 'ERROR') {
        setError("Access denied. Credentials do not match your vault fingerprint.");
        setIsProcessing(false);
      }
    };
    return () => workerRef.current?.terminate();
  }, [setVaultKey]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input) return;

    setIsProcessing(true);

    const isPwd = mode === 'password';
    const wrappedKeyBase64 = isPwd ? profile.wrapped_vault_key_pwd : profile.wrapped_vault_key_rec;
    const ivBase64 = isPwd ? profile.iv_pwd : profile.iv_rec;

    workerRef.current?.postMessage({
      type: 'VAULT_UNLOCK',
      input: input.trim(),
      saltStr: profile.salt,
      wrappedKeyBase64,
      ivBase64
    } as WorkerMessage);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-black/40 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
        <Lock className="w-8 h-8 text-white/80" />
      </div>
      
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Vault is Encrypted</h2>
      <p className="text-gray-400 text-sm mb-6">Decrypt your secure local session to access files.</p>

      {/* Toggle Mode */}
      <div className="flex bg-black/50 border border-white/5 rounded-lg p-1 mb-6 text-xs font-medium">
        <button 
          onClick={() => {setMode('password'); setInput(''); setError(null);}}
          className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center ${mode === 'password' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Key className="w-3 h-3 mr-1.5" /> Master Password
        </button>
        <button 
          onClick={() => {setMode('recovery'); setInput(''); setError(null);}}
          className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center ${mode === 'recovery' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <RefreshCw className="w-3 h-3 mr-1.5" /> Recovery Phrase
        </button>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4">
        {mode === 'password' ? (
          <input 
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter your password..."
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-center text-white focus:ring-2 focus:ring-blue-500/50 outline-none font-mono"
            autoFocus
          />
        ) : (
          <textarea 
            rows={3}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter 12 recovery words..."
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-center text-white text-sm focus:ring-2 focus:ring-purple-500/50 outline-none font-mono resize-none"
            autoFocus
          />
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-900/40 text-red-400 text-xs p-3 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 mr-2" /> {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={isProcessing || !input}
          className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center shadow-lg disabled:opacity-50 ${mode === 'password' ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-500/20' : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/20'}`}
        >
          {isProcessing ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Validating Key...</>
          ) : (
            <><Unlock className="w-5 h-5 mr-2" /> Unlock Vault</>
          )}
        </button>
      </form>
    </div>
  );
}
