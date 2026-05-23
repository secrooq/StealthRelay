'use client';

import { useState, useEffect, useRef } from 'react';
import { LockOpen, AlertOctagon, Download, EyeOff, Loader2, KeyRound, ShieldCheck, Info, File, FolderArchive, FileCheck } from 'lucide-react';
import type { WorkerMessage, WorkerResponse } from '../workers/securityEngine.worker';
import JSZip from 'jszip';

interface DecryptedFileItem {
  name: string;
  url: string;
  size: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


export default function SecretReader({ id }: { id: string }) {
  const [status, setStatus] = useState<'loading' | 'password_required' | 'decrypting' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFileItem[]>([]);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [password, setPassword] = useState('');

  const [encryptedBuffer, setEncryptedBuffer] = useState<ArrayBuffer | null>(null);
  const [ivBase64, setIvBase64] = useState<string | null>(null);
  const [isFile, setIsFile] = useState<boolean>(false);
  const [salt, setSalt] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/securityEngine.worker.ts', import.meta.url));

    const handleUnzip = async (buffer: ArrayBuffer) => {
      try {
        setProgressStatus('📦 Unpacking zero-knowledge zip payload...');
        const zip = await JSZip.loadAsync(buffer);
        const items: DecryptedFileItem[] = [];
        const promises: Promise<void>[] = [];

        zip.forEach((relativePath, file) => {
          if (!file.dir) {
            const p = file.async('blob').then((blob) => {
              items.push({
                name: relativePath,
                url: URL.createObjectURL(blob),
                size: blob.size
              });
            });
            promises.push(p);
          }
        });

        await Promise.all(promises);

        if (items.length === 0) {
          throw new Error('Extracted archive was unexpectedly empty.');
        }

        // Also hold the raw ZIP as a master archive fallback
        const zipBlob = new Blob([buffer]);
        setDecryptedFileUrl(URL.createObjectURL(zipBlob));

        setDecryptedFiles(items);
        setStatus('success');
      } catch (err: any) {
        console.error('Local unpacking failure:', err);
        // Fallback: Treat the entire buffer as a monolithic ZIP
        const blob = new Blob([buffer]);
        const fallbackUrl = URL.createObjectURL(blob);
        setDecryptedFileUrl(fallbackUrl);
        setDecryptedFiles([{
          name: 'StealthRelay_SecureBundle.zip',
          url: fallbackUrl,
          size: blob.size
        }]);
        setStatus('success');
      }
    };

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === 'PROGRESS') {
        setProgressStatus(data.status);
      } else if (data.type === 'DECRYPT_RESULT') {
        if (isFile) {
          handleUnzip(data.decryptedBuffer);
        } else {
          const decoder = new TextDecoder();
          setDecryptedText(decoder.decode(data.decryptedBuffer));
          setStatus('success');
        }
      } else if (data.type === 'ERROR') {
        setErrorMessage(data.message);
        setStatus('error');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [isFile]);

  // Robust resource cleanup to prevent Object URL memory expansion
  useEffect(() => {
    return () => {
      if (decryptedFileUrl) {
        URL.revokeObjectURL(decryptedFileUrl);
      }
      decryptedFiles.forEach((file) => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [decryptedFileUrl, decryptedFiles]);


  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchSecret = async () => {
      try {
        setProgressStatus('🤝 Initiating handshake with secure edge...');
        const res = await fetch(`/api/secret/${id}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This secret does not exist. It was already burned or expired.');
          }
          throw new Error('Failed to download payload from grid.');
        }

        const isFileHeader = res.headers.get('X-Stealth-Is-File') === '1';
        const ivHeader = res.headers.get('X-Stealth-IV');
        const hasPasswordHeader = res.headers.get('X-Stealth-Has-Password') === '1';
        const saltHeader = res.headers.get('X-Stealth-Salt');

        if (!ivHeader) throw new Error('Integrity failure: Missing vector chain.');

        setIsFile(isFileHeader);
        setIvBase64(ivHeader);
        
        const buffer = await res.arrayBuffer();
        setEncryptedBuffer(buffer);

        if (hasPasswordHeader) {
          setSalt(saltHeader);
          setStatus('password_required');
        } else {
          await triggerDecryption(buffer, ivHeader);
        }
      } catch (err: any) {
        setErrorMessage(err.message);
        setStatus('error');
      }
    };

    fetchSecret();
  }, [id]);

  const triggerDecryption = async (buffer: ArrayBuffer, ivStr: string, pwd?: string, s?: string) => {
    setStatus('decrypting');
    setProgressStatus('🔑 Expanding cryptographic parameters...');
    
    try {
      const ivBuffer = new Uint8Array(atob(ivStr).split('').map(c => c.charCodeAt(0))).buffer;
      let keyBuffer: ArrayBuffer | undefined = undefined;

      if (!pwd) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        let keyBase64 = hashParams.get('key') || window.location.hash.substring(1).replace('key=', '');
        
        if (!keyBase64) throw new Error('Extraction Key not found in secure URL slice.');
        keyBuffer = new Uint8Array(atob(keyBase64).split('').map(c => c.charCodeAt(0))).buffer;
      }

      setProgressStatus('🔓 Decoupling high-entropy AES layer locally...');
      
      workerRef.current?.postMessage({
        type: 'DECRYPT',
        encryptedBuffer: buffer,
        ivBuffer,
        keyBuffer,
        password: pwd,
        salt: s
      } as WorkerMessage);

    } catch (err: any) {
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (encryptedBuffer && ivBase64 && salt) {
      triggerDecryption(encryptedBuffer, ivBase64, password, salt);
    }
  };

  if (status === 'loading' || status === 'decrypting') {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center space-y-6 font-mono">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full animate-ping" />
          <Loader2 className="w-16 h-16 text-[#e5c158] animate-spin relative z-10 animate-pulse" />
        </div>
        <h2 className="text-lg font-black text-white tracking-wide uppercase">
          {status === 'loading' ? 'Grid Isolation Triggered' : 'Running Local Sandbox'}
        </h2>
        <div className="bg-black/40 border border-white/10 p-4 rounded-xl font-mono text-[10px] uppercase font-bold text-[#e5c158]/80">
          {progressStatus || 'Initializing protocol...'}
        </div>
      </div>
    );
  }

  if (status === 'password_required') {
    return (
      <div className="w-full max-w-xl mx-auto p-8 bg-[#070709]/85 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl text-center animate-in fade-in zoom-in font-mono relative overflow-hidden">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />

        <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#d4af37]/20">
          <KeyRound className="w-8 h-8 text-[#e5c158]" />
        </div>
        <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Barrier Detected</h2>
        <p className="text-slate-400 text-xs mb-8 uppercase tracking-wider">This transmission is locked with custom entropy. One attempt permitted before destruction.</p>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Input decryption authorization..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-center text-white focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all font-mono text-sm uppercase tracking-widest font-bold"
            autoFocus
          />
          <button 
            type="submit"
            disabled={!password}
            className="w-full bg-[#d4af37] hover:bg-[#e5c158] text-black font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center shadow-lg text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            Break Lock
          </button>
        </form>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="w-full max-w-xl mx-auto p-8 bg-red-955/10 border border-red-900/30 rounded-3xl backdrop-blur-xl shadow-2xl text-center animate-in fade-in zoom-in font-mono relative overflow-hidden">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/20" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/20" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500/20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/20" />

        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <AlertOctagon className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-black text-white mb-4 uppercase tracking-wide">Stream Nullified</h2>
        <p className="text-red-300 text-xs mb-6 leading-relaxed uppercase tracking-wider font-bold">🚨 {errorMessage}</p>
        <p className="text-[9px] uppercase tracking-widest text-slate-600 border-t border-white/5 pt-4 font-bold">
          Security Erasure Complete
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-[#070709]/85 border border-[#d4af37]/20 rounded-3xl backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 font-mono relative overflow-hidden">
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
          <ShieldCheck className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-wide">Isolation Restored</h2>
        <p className="text-[9px] text-slate-500 flex items-center mt-1 font-mono uppercase tracking-widest font-bold">
          <EyeOff className="w-3 h-3 mr-1.5" /> Memory purged from edge
        </p>
      </div>

      {/* CRITICAL SECURITY BANNER */}
      {isFile && (
        <div className="mb-6 p-4 bg-[#d4af37]/5 border border-[#d4af37]/20 rounded-xl flex items-start">
          <Info className="w-5 h-5 text-[#e5c158] mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">🔒 Zero-Knowledge Anonymity Confirmed</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed uppercase">
              All tracking metadata, GPS stamps, and device markers were mathematically bleached client-side before transmission.
              Files have been decrypted inside browser RAM. Sensitive identifiers are completely purged.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isFile ? (
          <div className="text-center py-8 bg-black/40 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">Secure Payload Assembled</h3>
            <p className="text-slate-500 text-xs mb-8 max-w-xs mx-auto uppercase font-bold tracking-wider">
              Your sanitized content is ready for local storage.
            </p>
            
            {decryptedFiles.length === 1 ? (
              <div className="space-y-6 w-full px-6 flex flex-col items-center font-mono">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center mb-2">
                  <FileCheck className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold break-all max-w-md mx-auto px-4 text-sm uppercase tracking-wider">{decryptedFiles[0].name}</h4>
                  <p className="text-slate-550 text-[10px] mt-1 font-mono font-bold">{formatSize(decryptedFiles[0].size)}</p>
                </div>
                
                <a 
                  href={decryptedFiles[0].url} 
                  download={decryptedFiles[0].name}
                  className="inline-flex items-center bg-[#d4af37] hover:bg-[#e5c158] text-black font-black py-4 px-8 rounded-xl transition-all shadow-[0_0_30px_rgba(212,175,55,0.25)] shrink-0 mt-4 text-xs uppercase tracking-[0.2em]"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Deploy Secure File
                </a>
              </div>
            ) : (
              <div className="w-full px-4 md:px-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <FolderArchive className="w-5 h-5 text-[#e5c158]" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">Multi-Asset Bundle ({decryptedFiles.length} files)</span>
                </div>

                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 mb-6">
                  {decryptedFiles.map((file, idx) => (
                    <div key={idx} className="bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all">
                      <div className="flex items-center gap-3 overflow-hidden pr-4 text-left">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-[#d4af37]/35 group-hover:bg-[#d4af37]/5 transition-all">
                          <File className="w-5 h-5 text-gray-400 group-hover:text-[#e5c158] transition-colors" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-white text-xs font-bold truncate break-all uppercase tracking-wider">{file.name}</p>
                          <p className="text-slate-500 text-[9px] font-mono font-bold">{formatSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <a 
                        href={file.url} 
                        download={file.name}
                        className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#d4af37] hover:text-black transition-all border border-white/10 shrink-0 text-gray-300"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>

                {decryptedFileUrl && (
                  <div className="pt-4 border-t border-white/5 text-center mt-2 font-mono">
                    <a 
                      href={decryptedFileUrl} 
                      download="StealthRelay_SecureBundle.zip"
                      className="inline-flex items-center gap-2 text-[10px] text-[#e5c158] hover:text-white underline hover:no-underline font-bold uppercase tracking-wider transition-all"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      Download Entire Archive (.zip)
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 uppercase tracking-wider">Decrypted Stream</label>
            <div className="bg-black/60 border border-white/10 rounded-xl p-6 shadow-inner">
              <pre className="text-white font-mono text-xs whitespace-pre-wrap break-words leading-relaxed">{decryptedText}</pre>
            </div>
            <p className="text-center text-[9px] text-red-400/60 mt-6 uppercase tracking-[0.2em] font-bold">
              Close this window immediately after consumption.
            </p>
          </div>
        )}
      </div>

      {/* Trojan banner */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <a 
          href="/" 
          className="group block p-4 md:p-5 rounded-2xl bg-[#d4af37]/5 hover:bg-[#d4af37]/10 border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-[#d4af37]/20">
              <ShieldCheck className="w-5 h-5 text-[#e5c158]" />
            </div>
            <div className="flex-grow font-mono">
              <h4 className="text-xs font-bold text-[#e5c158] group-hover:text-white transition-colors flex items-center uppercase tracking-wider">
                Transport your own secrets safely
                <span className="ml-2 text-[#e5c158] group-hover:translate-x-1 transition-transform duration-300 text-xs">→</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed uppercase">
                Don't leave your private data exposed. Join <strong className="text-white underline font-semibold">StealthRelay</strong> today and use military-grade zero-knowledge vaults.
              </p>
            </div>
          </div>
        </a>
      </div>

    </div>
  );
}
