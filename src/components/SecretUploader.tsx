'use client';

import { useState, useRef, useEffect } from 'react';
import { Lock, FileText, UploadCloud, CheckCircle, AlertTriangle, Loader2, Copy, KeyRound, ShieldAlert, XCircle, FileArchive, Trash2, Globe } from 'lucide-react';
import type { WorkerMessage, WorkerResponse } from '../workers/securityEngine.worker';
import JSZip from 'jszip';

export default function SecretUploader() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<'text' | 'file'>('text');
  
  // Features States
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [useAiScan, setUseAiScan] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [anonymizeFilenames, setAnonymizeFilenames] = useState(true);
  
  const [useLockdown, setUseLockdown] = useState(false);
  const [allowedCountries, setAllowedCountries] = useState('');
  const [allowedIps, setAllowedIps] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  
  const [status, setStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);

  // Safety Refs to prevent closure traps
  const stateRef = useRef({ text, files, mode, password, usePassword, stripMetadata, anonymizeFilenames, allowedCountries, allowedIps, allowedDomains, useLockdown });
  useEffect(() => {
    stateRef.current = { text, files, mode, password, usePassword, stripMetadata, anonymizeFilenames, allowedCountries, allowedIps, allowedDomains, useLockdown };
  }, [text, files, mode, password, usePassword, stripMetadata, anonymizeFilenames, allowedCountries, allowedIps, allowedDomains, useLockdown]);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/securityEngine.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === 'PROGRESS') {
        setStatus(data.status);
        if (data.progress !== undefined) setProgressPercent(data.progress);
        else setProgressPercent(null);
      } else if (data.type === 'ERROR') {
        setError(data.message);
        setIsProcessing(false);
        setProgressPercent(null);
      } else if (data.type === 'SCAN_RESULT') {
        if (!data.isSafe) {
          setError('Harmful or unsafe content detected. Upload aborted.');
          setIsProcessing(false);
          setProgressPercent(null);
        } else {
          processAndEncryptPayload();
        }
      } else if (data.type === 'ENCRYPT_RESULT') {
        uploadToServer(data.encryptedBuffer, data.iv, data.keyBuffer, data.salt, data.hasPassword, stateRef.current.mode);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []); 

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
          resolve(file); // Fallback
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        // toBlob inherently creates a pure, fresh binary stream stripped of ALL file metadata tags.
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

  const processAndEncryptPayload = async () => {
    if (!workerRef.current) return;
    const current = stateRef.current;
    
    try {
      let bufferToEncrypt: ArrayBuffer;

      if (current.mode === 'text') {
        setStatus('Deriving secure keys...');
        const encoder = new TextEncoder();
        bufferToEncrypt = encoder.encode(current.text).buffer;
      } else {
        if (current.files.length === 0) {
          setError('No files selected.');
          setIsProcessing(false);
          return;
        }

        // STEP 1: Sanitize Metadata if selected
        let finalBlobs: Blob[] = [];
        if (current.stripMetadata) {
          setStatus('🔬 Bleaching EXIF and tracking data from images...');
          setProgressPercent(10);
          for (let i = 0; i < current.files.length; i++) {
            const sanitized = await sanitizeImage(current.files[i]);
            finalBlobs.push(sanitized);
          }
        } else {
          finalBlobs = [...current.files];
        }

        // STEP 2: Package ALWAYS into a ZIP to preserve extensions securely
        setStatus('📦 Packaging assets into zero-knowledge bundle...');
        setProgressPercent(40);
        
        const zip = new JSZip();
        finalBlobs.forEach((blob, index) => {
          const originalName = current.files[index].name;
          let filenameToUse = originalName;
          if (current.anonymizeFilenames) {
            const ext = originalName.includes('.') ? originalName.split('.').pop() : '';
            filenameToUse = `stealth_payload_${index + 1}${ext ? '.' + ext : ''}`;
          }
          zip.file(filenameToUse, blob);
        });
        
        const zipBlob = await zip.generateAsync({ 
          type: 'blob', 
          compression: 'STORE'
        });
        
        setProgressPercent(60);
        setStatus('🔑 Generating ephemeral crypto-layer...');
        bufferToEncrypt = await zipBlob.arrayBuffer();
      }

      workerRef.current.postMessage({ 
        type: 'ENCRYPT', 
        buffer: bufferToEncrypt,
        password: current.usePassword ? current.password : undefined 
      } as WorkerMessage);

    } catch (err: any) {
      setError('Pipeline failure: ' + err.message);
      setIsProcessing(false);
    }
  };

  const uploadToServer = async (encryptedBuffer: ArrayBuffer, iv: ArrayBuffer, keyBuffer?: ArrayBuffer, salt?: string, hasPassword?: boolean, activeMode?: string) => {
    try {
      setStatus('🚀 Uploading secure stream to edge network...');
      setProgressPercent(90);
      
      const formData = new FormData();
      const blob = new Blob([encryptedBuffer]);
      formData.append('file', blob);
      formData.append('isFile', String(activeMode === 'file'));
      
      const ivBase64 = btoa(String.fromCharCode(...new Uint8Array(iv)));
      formData.append('iv', ivBase64);

      if (hasPassword && salt) {
        formData.append('hasPassword', '1');
        formData.append('salt', salt);
      }

      if (stateRef.current.useLockdown) {
        if (stateRef.current.allowedCountries.trim()) formData.append('allowedCountries', stateRef.current.allowedCountries.trim());
        if (stateRef.current.allowedIps.trim()) formData.append('allowedIps', stateRef.current.allowedIps.trim());
        if (stateRef.current.allowedDomains.trim()) formData.append('allowedDomains', stateRef.current.allowedDomains.trim());
      }

      const res = await fetch('/api/secret', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload rejected by server.');
      const data = await res.json();
      
      let url = `${window.location.origin}/read?id=${data.id}`;
      if (!hasPassword && keyBuffer) {
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(keyBuffer)));
        url += `#key=${keyBase64}`;
      }

      setProgressPercent(100);
      setFinalUrl(url);
      setStatus('Done!');
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred during final upload');
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    setFinalUrl(null);
    setProgressPercent(null);
    
    if (mode === 'text' && !text.trim()) {
      setError('Please enter a secret text.');
      setIsProcessing(false);
      return;
    }

    if (mode === 'file' && files.length === 0) {
      setError('Please select at least one file.');
      setIsProcessing(false);
      return;
    }

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (mode === 'file' && totalSize > 50 * 1024 * 1024) {
      setError('Combined total size exceeds 50MB limit.');
      setIsProcessing(false);
      return;
    }

    if (usePassword && !password) {
      setError('Please provide an encryption password.');
      setIsProcessing(false);
      return;
    }

    if (useAiScan && mode === 'text' && workerRef.current) {
      setStatus('Initializing local AI Scanner...');
      workerRef.current.postMessage({ type: 'SCAN_TEXT', payload: text } as WorkerMessage);
    } else {
      processAndEncryptPayload();
    }
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const copyToClipboard = () => {
    if (finalUrl) {
      navigator.clipboard.writeText(finalUrl);
      setStatus('Copied!');
      setTimeout(() => setStatus('Done!'), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-[#070709]/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden font-mono">
      {/* Tactical reticle markers */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/30" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#d4af37]/30" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#d4af37]/30" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/30" />

      {/* Mode Switcher */}
      <div className="flex space-x-2 mb-8 p-1.5 bg-black/60 border border-white/10 rounded-xl w-max mx-auto shadow-inner">
        <button 
          type="button"
          onClick={() => setMode('text')} 
          className={`flex items-center px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'text' ? 'bg-[#d4af37] text-black shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <FileText className="w-4 h-4 mr-2" /> Text
        </button>
        <button 
          type="button"
          onClick={() => setMode('file')} 
          className={`flex items-center px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'file' ? 'bg-[#d4af37] text-black shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <UploadCloud className="w-4 h-4 mr-2" /> Files
        </button>
      </div>

      {!finalUrl ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'text' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-350 mb-2">Your Secret Text</label>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Enter passwords, API keys, or sensitive notes here... Encrypted locally."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none font-mono text-xs font-bold shadow-inner"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-350 mb-2">Secure Assets</label>
              <div className="border border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#d4af37]/30 transition-colors bg-slate-950 shadow-inner relative">
                <input 
                  type="file" 
                  multiple
                  onChange={handleFileSelection}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                  id="file-upload" 
                />
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-slate-500 mb-3" />
                  <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Drop files here or click to add</span>
                  <span className="text-slate-600 text-[10px] mt-1 font-bold">Total Limit: 50MB (All types supported)</span>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {files.map((f, idx) => (
                    <div key={`${f.name}-${idx}`} className="p-3 bg-slate-950 border border-white/10 rounded-lg flex items-center justify-between">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="w-4 h-4 text-[#e5c158] mr-2 flex-shrink-0" />
                        <span className="text-xs text-slate-300 truncate font-bold uppercase tracking-wide">{f.name}</span>
                        <span className="text-[10px] text-slate-550 ml-2 flex-shrink-0">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400 p-1 transition-colors" aria-label="Remove file">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === 'text' ? (
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2 text-purple-400" />
                    AI Anti-Toxicity
                  </label>
                  <button type="button" role="switch" aria-checked={useAiScan} onClick={() => setUseAiScan(!useAiScan)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useAiScan ? 'bg-purple-500' : 'bg-gray-600'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useAiScan ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Scans offline using local weights.</p>
              </div>
            ) : (
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                    <Trash2 className="w-4 h-4 mr-2 text-red-400" />
                    Bleach Metadata
                  </label>
                  <button type="button" role="switch" aria-checked={stripMetadata} onClick={() => setStripMetadata(!stripMetadata)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${stripMetadata ? 'bg-red-500' : 'bg-gray-600'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${stripMetadata ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Destroy EXIF/GPS tracking from images in RAM.</p>
              </div>
            )}

            <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                  <KeyRound className="w-4 h-4 mr-2 text-blue-400" />
                  Custom Lock
                </label>
                <button type="button" role="switch" aria-checked={usePassword} onClick={() => setUsePassword(!usePassword)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${usePassword ? 'bg-blue-500' : 'bg-gray-600'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${usePassword ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Password requirement for decryption.</p>
            </div>

            <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-orange-400" />
                  Geofencing / IP
                </label>
                <button type="button" role="switch" aria-checked={useLockdown} onClick={() => setUseLockdown(!useLockdown)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useLockdown ? 'bg-orange-500' : 'bg-gray-600'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${useLockdown ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Restrict to countries / IP ranges.</p>
            </div>

            {mode === 'file' && (
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-400" />
                    Anonymize Names
                  </label>
                  <button type="button" role="switch" aria-checked={anonymizeFilenames} onClick={() => setAnonymizeFilenames(!anonymizeFilenames)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${anonymizeFilenames ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${anonymizeFilenames ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 uppercase tracking-wide">Purge original sensitive filenames from ZIP carrier.</p>
              </div>
            )}
          </div>

          {useLockdown && (
            <div className="space-y-4 p-4 bg-orange-950/10 border border-orange-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center">
                <ShieldAlert className="w-3 h-3 mr-2" /> Perimeter Rulesets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Allowed Country Codes (ISO)</label>
                  <input 
                    type="text"
                    value={allowedCountries}
                    onChange={(e) => setAllowedCountries(e.target.value)}
                    placeholder="e.g., US, GB, BD"
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Allowed IP Ranges (CIDR)</label>
                  <input 
                    type="text"
                    value={allowedIps}
                    onChange={(e) => setAllowedIps(e.target.value)}
                    placeholder="e.g., 192.168.1.1, 10.0.0.0/24"
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Restrict to Visitor Email Domain</label>
                <input 
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="e.g., corp.com, secure.mil"
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]/50"
                />
                <p className="text-[8px] text-gray-500 mt-1 uppercase">Requires active StealthRelay session auth to view. Leave blank for anyone with the link.</p>
              </div>
            </div>
          )}

          {usePassword && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Access Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Custom decryption key..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white placeholder-slate-700 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 transition-all font-mono text-xs font-bold shadow-inner"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl flex items-start animate-in fade-in zoom-in">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-red-300 text-xs font-bold uppercase tracking-wider">🚨 {error}</p>
              </div>
              <button type="button" onClick={() => setError(null)} className="text-red-400 ml-2" aria-label="Dismiss error">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-[#d4af37] hover:bg-[#e5c158] text-black font-black py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center text-xs uppercase tracking-[0.2em] shadow-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {status.includes('Bleaching') ? 'Sanitizing...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-3" />
                  Generate Secure Link
                </>
              )}
            </button>
            
            {isProcessing && status && (
              <div className="px-2">
                <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                  <span>{status}</span>
                  {progressPercent !== null && <span>{progressPercent}%</span>}
                </div>
                {progressPercent !== null && (
                  <div className="w-full bg-slate-950 border border-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#d4af37] to-[#e5c158] h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Pipeline Complete</h2>
            <p className="text-gray-400 text-xs max-w-md mx-auto uppercase tracking-wider leading-relaxed">
              The stream has been deployed. Share this unique hash to allow single-viewer decryption.
            </p>
          </div>

          <div className="p-4 bg-black/60 border border-white/10 rounded-xl flex items-center shadow-inner">
            <input readOnly value={finalUrl} className="bg-transparent w-full text-[#e5c158] text-xs outline-none font-mono select-all" />
            <button onClick={copyToClipboard} className="ml-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white flex-shrink-0" aria-label="Copy to clipboard">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          {status === 'Copied!' && (
            <p className="text-green-400 text-xs text-center font-bold uppercase tracking-wider">URL copied to clipboard</p>
          )}

          <button 
            type="button"
            onClick={() => { setFinalUrl(null); setText(''); setFiles([]); setPassword(''); }}
            className="w-full bg-transparent border border-white/10 text-gray-300 font-bold uppercase tracking-wider text-xs py-3.5 px-4 rounded-xl hover:bg-white/5 transition-colors"
          >
            Create New Secure Transmission
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-white/5 text-center flex items-center justify-center space-x-4">
        <p className="text-[9px] text-gray-600 flex items-center uppercase font-bold tracking-wider">
          <ShieldAlert className="w-3 h-3 mr-1" /> Zero-Trust Persistence
        </p>
        <p className="text-[9px] text-gray-600 flex items-center uppercase font-bold tracking-wider">
          <Lock className="w-3 h-3 mr-1" /> AES-256-GCM local
        </p>
      </div>
    </div>
  );
}
