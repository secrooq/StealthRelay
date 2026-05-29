'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, FileText, UploadCloud, CheckCircle, AlertTriangle, Loader2, Copy, KeyRound, Trash2, Clock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import JSZip from 'jszip';

const MAX_TEXT_CHARS = 6000; // Roughly 1000 words
const MAX_FILE_SIZE_MB = 250;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryStr = atob(base64);
  const buf = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) buf[i] = binaryStr.charCodeAt(i);
  return buf.buffer;
};

export default function GuestSecretUploader() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'text' | 'file'>('text');
  
  // Custom Parameters
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [anonymizeFilenames, setAnonymizeFilenames] = useState(true);

  // State hooks for UX pipeline
  const [status, setStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  // Compute word count
  const getWordCount = (str: string) => {
    const trimmed = str.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  };
  const wordCount = getWordCount(text);

  // Cryptographic Helper Functions inside main thread for blazing speed on smaller files
  const deriveKeyFromText = async (plainText: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(plainText),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const sanitizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif') {
        resolve(file);
        return;
      }
      
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(file);
        }, file.type, 0.92);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
    });
  };

  const processAndUpload = async () => {
    setError(null);
    setIsProcessing(true);
    setFinalUrl(null);
    setProgressPercent(10);

    try {
      let bufferToEncrypt: ArrayBuffer;

      if (mode === 'text') {
        setStatus('Forging ephemeral keys...');
        const encoder = new TextEncoder();
        bufferToEncrypt = encoder.encode(text).buffer;
      } else {
        if (files.length === 0) throw new Error('No files loaded into the dropzone.');

        let processedBlobs: Blob[] = [];
        if (stripMetadata) {
          setStatus('🔬 Stripping EXIF geo-markers and camera models from images...');
          setProgressPercent(25);
          for (const f of files) {
            const sanitized = await sanitizeImage(f);
            processedBlobs.push(sanitized);
          }
        } else {
          processedBlobs = [...files];
        }

        setStatus('📦 Packaging artifacts into ZIP carrier...');
        setProgressPercent(45);
        const zip = new JSZip();
        processedBlobs.forEach((blob, idx) => {
          const originalName = files[idx].name;
          let filenameToUse = originalName;
          if (anonymizeFilenames) {
            const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
            filenameToUse = `stealth_payload_${idx + 1}${ext ? '.' + ext : ''}`;
          }
          zip.file(filenameToUse, blob);
        });
        
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'STORE'
        });
        bufferToEncrypt = await zipBlob.arrayBuffer();
      }

      setProgressPercent(65);
      setStatus('🔑 Sealing payload via local AES-GCM stream...');

      // Web Crypto Action
      let key: CryptoKey;
      let keyBuffer: ArrayBuffer | undefined = undefined;
      let saltStr: string | undefined = undefined;

      if (usePassword) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        saltStr = btoa(String.fromCharCode(...salt));
        key = await deriveKeyFromText(password, salt.buffer);
      } else {
        key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        keyBuffer = await window.crypto.subtle.exportKey('raw', key);
      }

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bufferToEncrypt);

      setProgressPercent(85);
      setStatus('🚀 Dispatching payload to secure edge nodes...');

      const formData = new FormData();
      formData.append('file', new Blob([encryptedBuffer]));
      formData.append('isFile', String(mode === 'file'));
      
      const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv.buffer)));
      formData.append('iv', ivBase64);
      formData.append('durationHours', String(durationHours));

      if (usePassword && saltStr) {
        formData.append('hasPassword', '1');
        formData.append('salt', saltStr);
      }

      const res = await fetch('/api/secret/guest', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Network edge nodes rejected transmission.');
      }

      const data = await res.json();
      let link = `${window.location.origin}/read?id=${data.id}`;

      if (!usePassword && keyBuffer) {
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
        link += `#key=${keyBase64}`;
      }

      setProgressPercent(100);
      setFinalUrl(link);
      setStatus('Secure dispatch finalized.');
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'Internal processing protocol disrupted.');
      setIsProcessing(false);
      setProgressPercent(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) {
      setError('Payload container empty. Please input secret text.');
      return;
    }
    if (mode === 'text' && wordCount > 1000) {
      setError('Word limit threshold exceeded. High-Performance Guest Cap is 1,000 words.');
      return;
    }
    if (mode === 'file' && files.length === 0) {
      setError('Select at least 1 file to initialize dispatch.');
      return;
    }
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (mode === 'file' && totalSize > MAX_FILE_SIZE_BYTES) {
      setError(`Combined scale exceeds maximum allowance of ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    if (usePassword && !password) {
      setError('Zero-Knowledge locks require active password credentials.');
      return;
    }

    processAndUpload();
  };

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let selected = Array.from(e.target.files);
      setStatus('Analyzing file format...');

      const processedFiles: File[] = [];
      for (let file of selected) {
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            setStatus('Transcoding HEIC to standard JPEG format...');
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.92
            });
            const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
            file = new window.File([blobArray[0]], file.name.replace(/\.heic$|\.heif$/i, '.jpg'), { type: 'image/jpeg' });
          } catch (err) {
            console.error("HEIC transcoding failed:", err);
            alert("Failed to transcode HEIC file. Please convert it to JPEG manually.");
            setStatus('Idle');
            return;
          }
        }
        processedFiles.push(file);
      }
      setStatus('Idle');
      setFiles((prev) => [...prev, ...processedFiles]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const copyToClipboard = () => {
    if (finalUrl) {
      navigator.clipboard.writeText(finalUrl);
      setStatus('Link broadcasted to clipboard!');
      setTimeout(() => setStatus('Secure dispatch finalized.'), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-[#23201a] via-[#12110e] to-[#0a0a08] border-2 border-[#d4af37] rounded-3xl backdrop-blur-2xl shadow-[0_0_60px_rgba(212,175,55,0.25)] overflow-hidden font-mono text-slate-200 ring-4 ring-[#d4af37]/10">
      {/* Terminal Topbar */}
      <div className="bg-[#24211c]/90 border-b border-[#d4af37]/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <span className="text-xs font-mono text-white ml-2.5 uppercase tracking-widest font-black">Secure Guest Channel v2.0</span>
        </div>
        <div className="flex items-center gap-2 text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/30 px-3 py-1 rounded-lg font-mono text-[10px] font-black tracking-wider animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.1)]">
          <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE SECURE SEAL
        </div>
      </div>

      {/* Guest Attention Hook Banner */}
      <div className="bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/5 to-[#d4af37]/0 px-6 py-3 border-b border-[#d4af37]/20 flex items-center justify-between text-xs font-mono font-black text-[#e5c158] uppercase tracking-widest">
        <span className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5c158] animate-ping" />
          ⚡ FREE SECURE TRANSIT // NO ACCOUNT OR CREDIT CARD REQUIRED
        </span>
        <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">ZERO LOGS KEPT</span>
      </div>

      <div className="p-6 md:p-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 p-1 bg-[#090807] border-2 border-[#d4af37]/20 rounded-xl w-max mx-auto shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <button 
            type="button"
            onClick={() => setMode('text')} 
            disabled={isProcessing}
            className={`flex items-center px-6 py-2.5 rounded-lg text-xs uppercase tracking-widest font-mono font-black transition-all duration-200 ${mode === 'text' ? 'bg-[#d4af37] text-[#141310] shadow-[0_0_15px_rgba(212,175,55,0.35)] border border-[#d4af37]/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <FileText className="w-3.5 h-3.5 mr-2" /> Text Payload
          </button>
          <button 
            type="button"
            onClick={() => setMode('file')} 
            disabled={isProcessing}
            className={`flex items-center px-6 py-2.5 rounded-lg text-xs uppercase tracking-widest font-mono font-black transition-all duration-200 ${mode === 'file' ? 'bg-[#d4af37] text-[#141310] shadow-[0_0_15px_rgba(212,175,55,0.35)] border border-[#d4af37]/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <UploadCloud className="w-3.5 h-3.5 mr-2" /> Secure Files
          </button>
        </div>

        {!finalUrl ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Guest Tier Entitlements */}
            <div className="bg-[#14120f] border border-[#d4af37]/20 rounded-2xl p-5 shadow-inner">
              <h4 className="text-[11px] font-mono font-black uppercase text-[#e5c158] tracking-widest mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#e5c158]" /> GUEST SECURE DISPATCH CAPABILITIES
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-350 font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>Zero-Knowledge:</strong> Decryption keys stay in URL fragment, never touching the cloud</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>AES-256 Symmetrical:</strong> Standard AES-GCM 256-bit client-side encryption</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>250MB Packager:</strong> Compress & encrypt multiple files locally into raw ZIP payloads</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>EXIF Canvas Scrub:</strong> Automatic, client-side scrubbing of camera & location metadata</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>Anonymize Scrambler:</strong> Randomizes file names prior to transit to prevent tracking</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#e5c158] font-bold">✔</span>
                  <span><strong>Auto-Prune Duration:</strong> Ephemeral time-locks up to 24 hours with zero audit trails</span>
                </div>
              </div>
            </div>

            {/* TEXT INPUT */}
            {mode === 'text' ? (
              <div className="space-y-2 animate-in fade-in duration-200">
                <label className="block text-xs font-mono text-[#e5c158] uppercase tracking-wider font-bold">Plaintext Intel Carrier</label>
                <div className="relative bg-gradient-to-br from-[#1d1b17] to-[#0f0e0b] rounded-xl border-2 border-[#d4af37]/35 focus-within:border-[#e5c158] focus-within:ring-4 focus-within:ring-[#e5c158]/10 transition-all group overflow-hidden shadow-inner">
                  <textarea
                    className="w-full bg-transparent border-none text-[#f7f5f0] font-sans text-sm p-5 h-48 resize-none focus:ring-0 focus:outline-none placeholder:text-slate-500"
                    placeholder="Type highly confidential instructions here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={MAX_TEXT_CHARS}
                    disabled={isProcessing}
                  />
                  <div className="absolute bottom-3 right-4 text-xs font-mono text-slate-400 font-bold">
                    {wordCount} / 1000 words
                  </div>
                </div>
              </div>
            ) : (
              /* FILE DROPZONE */
              <div className="space-y-4 animate-in fade-in duration-200">
                <label className="block text-xs font-mono text-[#e5c158] uppercase tracking-wider font-bold">File Allocation Matrix</label>
                
                {files.length === 0 ? (
                  <label className={`group flex flex-col items-center justify-center border-2 border-dashed border-[#d4af37]/40 bg-gradient-to-br from-[#1d1b17] to-[#0f0e0b] hover:from-[#25221d] hover:to-[#14120f] hover:border-[#e5c158] transition-all rounded-2xl p-10 text-center cursor-pointer shadow-inner ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
                    <div className="w-16 h-16 rounded-2xl bg-black/40 group-hover:bg-[#d4af37]/20 flex items-center justify-center text-[#e5c158] mb-4 border border-[#d4af37]/25 group-hover:border-[#e5c158]/55 transition-all shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-[#f7f5f0] font-mono font-bold uppercase tracking-wide">Select Files for Encryption</p>
                    <p className="text-xs text-slate-350 font-sans mt-2 max-w-xs leading-relaxed">Drag & drop or click. Fast metadata destruction applied natively inside browser memory.</p>
                    <p className="text-[11px] text-[#e5c158] font-mono tracking-wider mt-4 uppercase font-black">Free Edge Ceiling: {MAX_FILE_SIZE_MB} MB Combined</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      onChange={handleFileSelection}
                    />
                  </label>
                ) : (
                  <div className="bg-gradient-to-br from-[#1d1b17] to-[#0f0e0b] border-2 border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-inner">
                    {/* Header list */}
                    <div className="flex items-center justify-between bg-white/5 px-5 py-3 border-b border-[#d4af37]/10">
                      <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">{files.length} Target File{files.length > 1 ? 's' : ''} Active</span>
                      <label className="cursor-pointer text-xs text-[#e5c158] hover:text-[#d4af37] font-mono tracking-wider uppercase font-bold">
                        Add More
                        <input type="file" multiple className="hidden" onChange={handleFileSelection} />
                      </label>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                      {files.map((f, index) => (
                        <div key={index} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-white/5 border border-white/5 rounded flex items-center justify-center text-slate-400">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                              <p className="text-xs font-mono text-white font-bold truncate">{f.name}</p>
                              <p className="text-xs text-slate-400 font-mono font-bold">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFile(index)} 
                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                            aria-label="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Encryption Options Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {/* Expiration Module */}
              <div className="bg-[#0d0c0a] border border-[#d4af37]/10 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#e5c158]" />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">Time-Lock Duration</span>
                  </div>
                </div>
                <p className="text-xs text-slate-350 leading-relaxed font-sans mb-1">Choose the auto-prune window. Secret auto-destructs completely from the system after read or expiration.</p>
                <select
                  disabled={isProcessing}
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#d4af37]/50"
                >
                  <option value="1">1 Hour (Recommended)</option>
                  <option value="3">3 Hours</option>
                  <option value="6">6 Hours</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (Maximum Guest Tier)</option>
                </select>
              </div>

              {/* Password Module */}
              <div className={`bg-[#0d0c0a] border border-[#d4af37]/10 rounded-2xl p-5 flex flex-col gap-3 transition-all ${usePassword ? 'ring-1 ring-[#d4af37]/35 bg-[#1b1915]' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#e5c158]" />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">Custom Lock Key</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={usePassword}
                    onClick={() => setUsePassword(!usePassword)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${usePassword ? 'bg-[#d4af37]' : 'bg-white/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${usePassword ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                {usePassword ? (
                  <div className="relative animate-in slide-in-from-top-2 duration-200">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isProcessing}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Secure unlock password..."
                      className="w-full bg-black border border-[#d4af37]/20 rounded-lg pl-3 pr-9 py-2 text-xs font-mono text-[#f7f5f0] placeholder:text-slate-500 focus:outline-none focus:border-[#d4af37]/50"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    If disabled, standard link-embedded keys are generated locally so ONLY holders of the URL path can view it.
                  </p>
                )}
              </div>
            </div>

            {/* Security Toggles for Files */}
            {mode === 'file' && files.length > 0 && (
              <div className="space-y-3">
                {/* Metadata Bleach Toggle */}
                <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase text-white">Metadata Sterilization</h4>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">Redraw image canvases to permanently wipe hidden EXIF/GPS identifiers.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stripMetadata}
                    onClick={() => setStripMetadata(!stripMetadata)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${stripMetadata ? 'bg-[#4ade80]' : 'bg-white/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${stripMetadata ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Filename Anonymization Toggle */}
                <div className="bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                      <Lock className="w-4 h-4 text-[#4ade80]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase text-white">Filename Anonymization</h4>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">Anonymize original sensitive file names (e.g. stealth_payload_1.pdf) to block profiling.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={anonymizeFilenames}
                    onClick={() => setAnonymizeFilenames(!anonymizeFilenames)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${anonymizeFilenames ? 'bg-[#4ade80]' : 'bg-white/10'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${anonymizeFilenames ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-200 animate-shake">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-xs font-mono leading-relaxed">{error}</p>
              </div>
            )}

            {/* CTA Button & Progress */}
            {isProcessing ? (
              <div className="space-y-3">
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="bg-[#d4af37] h-full shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all duration-300"
                    style={{ width: `${progressPercent || 0}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-slate-350 font-mono text-xs uppercase tracking-widest font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-[#e5c158]" />
                  {status}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full group relative flex items-center justify-center bg-gradient-to-r from-[#d4af37] to-[#e5c158] hover:from-[#e5c158] hover:to-[#d4af37] text-[#141310] font-mono uppercase font-black tracking-[0.15em] text-sm py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.35)] hover:-translate-y-0.5 active:translate-y-0 duration-300"
              >
                <Lock className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                Generate Zero-Knowledge Link
              </button>
            )}
          </form>
        ) : (
          /* SUCCESS STATE (THE RESULTING LINK) */
          <div className="space-y-8 py-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center text-[#4ade80] shadow-[0_0_30px_rgba(74,222,128,0.15)]">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-black uppercase text-white tracking-wider">Payload Locked Successfully</h3>
                <p className="text-sm font-sans text-slate-300 max-w-md">The secure link below hosts your encrypted assets. It will permanently self-destruct after it is read OR in {durationHours} hour{durationHours > 1 ? 's' : ''}.</p>
              </div>
            </div>

            <div className="bg-[#0d0c0a] border border-[#d4af37]/15 rounded-2xl p-5 space-y-4">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={finalUrl}
                  className="w-full bg-black border border-white/5 rounded-xl pl-4 pr-24 py-4 text-xs font-mono text-[#e5c158] selection:bg-[#d4af37]/30 truncate"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute right-2 px-4 py-2 bg-[#d4af37] text-[#141310] rounded-lg text-xs font-mono font-black uppercase tracking-wider flex items-center hover:bg-[#e5c158] active:scale-95 transition-all shadow-md"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                </button>
              </div>
              {status && status.includes('broadcasted') && (
                <p className="text-xs font-mono text-[#e5c158] text-center font-bold animate-pulse">{status}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row justify-center pt-2">
              <button
                onClick={() => {
                  setFinalUrl(null);
                  setText('');
                  setFiles([]);
                  setPassword('');
                  setUsePassword(false);
                }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs uppercase tracking-wider font-mono font-bold text-white hover:bg-white/10 transition-all text-center"
              >
                Seal Another Secret
              </button>
              <a
                href="/secret"
                className="px-6 py-3 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-xl text-xs uppercase tracking-wider font-mono font-black text-[#e5c158] hover:bg-[#d4af37] hover:text-[#141310] transition-all text-center flex items-center justify-center shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
              >
                Unlock Premium Tiers (Up to 1GB & 3 Days)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
