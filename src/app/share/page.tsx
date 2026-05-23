'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Lock, FileDown, Loader2, ShieldAlert, Download, Check, Copy, Link as LinkIcon, FileIcon, FileText, Image as ImageIcon, Video, Music, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function ShareRecipientContainer() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const [rawHash, setRawHash] = useState('');
  const [normalBase64Key, setNormalBase64Key] = useState('');
  const [step, setStep] = useState<'loading' | 'password_required' | 'ready' | 'downloading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [shareInfo, setShareInfo] = useState<{
    fileSize: number;
    mimeType: string;
    encryptedMeta: string;
    requiresPassword: boolean;
    shareIv: string;
  } | null>(null);

  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordHash, setPasswordHash] = useState('');

  const [decryptedMeta, setDecryptedMeta] = useState<{ fileName: string } | null>(null);
  const [progress, setProgress] = useState('');
  const [downloadProgressPercent, setDownloadProgressPercent] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const workerRef = useRef<Worker | null>(null);

  // Utility formatting
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getIconForType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('image')) return <ImageIcon className="w-8 h-8 text-cyan-400" />;
    if (t.includes('video')) return <Video className="w-8 h-8 text-indigo-400" />;
    if (t.includes('audio')) return <Music className="w-8 h-8 text-emerald-400" />;
    if (t.includes('pdf') || t.includes('text') || t.includes('document') || t.includes('word')) return <FileText className="w-8 h-8 text-blue-400" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
  };

  // 1. Initial mounting and checks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!id) {
      setStep('error');
      setErrorMessage('Shared identifier not provided in parameters. Verify your secure link.');
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      setStep('error');
      setErrorMessage('Decryption secret is missing from the URL anchor (#). Retrieval is cryptographically impossible.');
      return;
    }
    setRawHash(hash);

    // Reconstruct standard base64 from URL-safe anchor hash
    let base64Key = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Key.length % 4) {
      base64Key += '=';
    }
    setNormalBase64Key(base64Key);

    // Fetch verification info from API
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'This link has expired, been deleted, or is invalid.');
        }
        
        const data = await res.json();
        setShareInfo(data);
        
        if (data.requiresPassword) {
          setStep('password_required');
        } else {
          // No password needed, start direct decryption engine setup
          initializeDecryption(base64Key, data.encryptedMeta);
        }
      } catch (e: any) {
        setStep('error');
        setErrorMessage(e.message || 'Could not connect to secure distribution network.');
      }
    };

    fetchInfo();
  }, [id]);

  // Initializing the cryptographic web worker
  const initializeDecryption = (key: string, encryptedMeta: string) => {
    if (!workerRef.current) {
      // Refactored worker constructor path for parent directory context
      workerRef.current = new Worker(new URL('../../workers/securityEngine.worker.ts', import.meta.url));
      
      workerRef.current.onmessage = (e: MessageEvent<any>) => {
        const msg = e.data;
        
        if (msg.type === 'PROGRESS') {
          setProgress(msg.status);
        }
        else if (msg.type === 'VAULT_DECRYPT_SHARE_META_RESULT') {
          setDecryptedMeta(msg.metadata);
          setStep('ready');
        }
        else if (msg.type === 'VAULT_DECRYPT_SHARE_FILE_RESULT') {
          triggerBrowserDownload(msg.decryptedBuffer);
        }
        else if (msg.type === 'ERROR') {
          setStep('error');
          setErrorMessage(msg.message || 'Decryption routine faulted. The anchor secret might be corrupted.');
        }
      };
    }

    // Trigger metadata decryption immediately
    workerRef.current.postMessage({
      type: 'VAULT_DECRYPT_SHARE_META',
      shareKeyBase64: key,
      encryptedMetaBase64: encryptedMeta
    });
  };

  // Password gateway handler
  const verifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isVerifying || !shareInfo) return;

    setIsVerifying(true);
    try {
      // Construct SHA-256 digest matching dashboard
      const encodedPwd = new TextEncoder().encode(password);
      const hashBuf = await crypto.subtle.digest('SHA-256', encodedPwd);
      const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuf)));
      
      setPasswordHash(hashB64);
      
      // Validate password by hitting the standard non-destructive share resource endpoint with method POST
      const res = await fetch(`/api/share/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordHash: hashB64 })
      });

      if (res.status === 401) {
        throw new Error("Invalid access password.");
      }
      if (!res.ok) {
        throw new Error("Server handshake error. File may have expired.");
      }

      // Successfully passed auth wall! Let's fire up cryptographic engine.
      initializeDecryption(normalBase64Key, shareInfo.encryptedMeta);
    } catch (e: any) {
      alert(e.message || "Access verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Download Execution
  const startDownload = async () => {
    if (!shareInfo) return;
    setStep('downloading');
    setProgress('Initiating cloud bytes pull...');
    
    try {
      const res = await fetch(`/api/share/${id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordHash })
      });

      if (!res.ok) throw new Error("Bytes retrieval rejected.");

      // We read response as a stream to track bytes progress (UX bonus)
      const reader = res.body?.getReader();
      const contentLength = shareInfo.fileSize;
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      if (!reader) throw new Error("Streaming not supported");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedLength += value.length;
        
        if (contentLength) {
          const pct = Math.round((receivedLength / contentLength) * 100);
          setDownloadProgressPercent(pct);
          setProgress(`Retrieving encrypted segments: ${pct}%`);
        } else {
          setProgress(`Pulled ${formatBytes(receivedLength)}...`);
        }
      }

      // Concatenate chunks
      setProgress('Assembling encrypted segments...');
      const combinedArray = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, position);
        position += chunk.length;
      }

      // Dispatch to worker for AES-GCM zero-knowledge decryption
      setProgress('Invoking AES-GCM key hardware...');
      workerRef.current?.postMessage({
        type: 'VAULT_DECRYPT_SHARE_FILE',
        shareKeyBase64: normalBase64Key,
        encryptedFileBuffer: combinedArray.buffer,
        shareIvBase64: shareInfo.shareIv
      }, [combinedArray.buffer]);

    } catch (e: any) {
      setStep('error');
      setErrorMessage(e.message || 'Encrypted transmission transfer aborted.');
    }
  };

  // Save file to browser disk
  const triggerBrowserDownload = (decBuffer: ArrayBuffer) => {
    const type = shareInfo?.mimeType || 'application/octet-stream';
    const blob = new Blob([decBuffer], { type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedMeta?.fileName || 'downloaded-file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    setStep('success');
    setProgress('Payload extracted securely.');
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5 backdrop-blur-md p-6 md:p-8 text-left overflow-hidden relative">
      
      {/* Step: Loading Initial Meta */}
      {step === 'loading' && (
        <div className="flex flex-col items-center py-10">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-slate-300 font-medium">Connecting to secure node...</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Verifying cryptographic link hash</p>
        </div>
      )}

      {/* Step: Password Gateway */}
      {step === 'password_required' && (
        <form onSubmit={verifyPassword} className="space-y-5 py-2">
          <div className="flex items-center gap-3 text-emerald-400">
            <Lock className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-semibold text-white">Access Lock Engaged</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The sender enforced standard validation gating. Please enter the specific transmission password. This is stored as a hash and remains client-exclusive.
          </p>

          <div>
            <label className="block text-[10px] uppercase text-slate-500 tracking-wider font-mono mb-1.5">Passphrase</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isVerifying}
              placeholder="Enter access password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || !password}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-emerald-500/20 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>Unlock Transmission</>
            )}
          </button>
        </form>
      )}

      {/* Step: Ready to Download */}
      {step === 'ready' && decryptedMeta && shareInfo && (
        <div className="space-y-6 py-2 animate-in fade-in duration-500">
          <div className="flex items-start gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
            <div className="shrink-0 p-2.5 bg-slate-800 border border-white/5 rounded-lg">
              {getIconForType(shareInfo.mimeType)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-slate-100 truncate break-all" title={decryptedMeta.fileName}>
                {decryptedMeta.fileName}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {formatBytes(shareInfo.fileSize)} • {shareInfo.mimeType.split('/')[1]?.toUpperCase() || 'Data'}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 border border-emerald-500/20 bg-emerald-950/20 rounded-xl p-3.5 space-y-1">
            <p className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Knowledge Decryption
            </p>
            <p className="leading-relaxed text-[11px]">
              Payload integrity verified. Decrypting browser-side using client CPU. Decryption secret never hits our logs.
            </p>
          </div>

          <button
            onClick={startDownload}
            className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-950/30 hover:shadow-emerald-500/20 transition-all duration-300"
          >
            <FileDown className="w-4 h-4" /> Download & Decrypt
          </button>
        </div>
      )}

      {/* Step: In-Progress Fetch & Decrypt */}
      {step === 'downloading' && (
        <div className="flex flex-col items-center py-10 space-y-5">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                strokeWidth="2"
                stroke="currentColor"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-300"
                strokeDasharray={`${downloadProgressPercent}, 100`}
                strokeWidth="2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
          
          <div className="text-center space-y-1.5">
            <p className="text-sm text-white font-semibold">Transferring Encrypted Bytes...</p>
            <p className="text-xs text-slate-400 font-mono">{progress}</p>
          </div>
        </div>
      )}

      {/* Step: Success Vector */}
      {step === 'success' && (
        <div className="py-2 space-y-6 animate-in fade-in duration-700">
          <div className="flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-4 text-emerald-300 text-center">
            <Check className="w-5 h-5" />
            <span className="font-medium text-sm">Payload Delivered & Decrypted</span>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-800/60 to-indigo-950/40 border border-indigo-500/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="relative space-y-3.5">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                🔒 Transport Your Own Secrets
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed font-medium">
                Tired of insecure cloud providers peaking into your data? Send multi-gigabyte files securely with zero-knowledge client keys using <span className="text-indigo-300 font-semibold">StealthRelay</span>.
              </p>
              <Link 
                href="https://stealthrelay.com"
                className="inline-flex w-full items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-950/50 transition-all group-hover:-translate-y-0.5 hover:shadow-indigo-500/20 border border-indigo-400/20"
              >
                Join StealthRelay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Step: Errors */}
      {step === 'error' && (
        <div className="space-y-5 py-2 animate-in shake duration-300">
          <div className="flex items-center gap-3 text-rose-400">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <h2 className="text-base font-semibold text-white">Transmission Offline</h2>
          </div>
          
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-4">
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {errorMessage}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Secure links are auto-destructed after their configured lifespan or manual owner revoke. If you believe this is an error, request a fresh ephemeral vector from the sender.
          </p>

          <Link 
            href="https://stealthrelay.com"
            className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-2.5 rounded-xl transition-all"
          >
            Visit StealthRelay <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ShareRecipientPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      
      {/* Decorative backdrop glowing circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
      
      <div className="w-full max-w-md text-center">
        {/* Branding Header */}
        <div className="inline-flex items-center justify-center p-3.5 bg-slate-900/80 border border-emerald-500/20 rounded-2xl mb-6 shadow-xl ring-1 ring-white/5">
          <Shield className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
          StealthRelay Share
        </h1>
        <p className="text-slate-400 text-xs mb-8 uppercase tracking-widest font-mono">
          Secure zero-knowledge file channel
        </p>

        <Suspense fallback={
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-400">Initializing channel verification...</p>
          </div>
        }>
          <ShareRecipientContainer />
        </Suspense>
      </div>
    </div>
  );
}
