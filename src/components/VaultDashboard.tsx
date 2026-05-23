'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, File, Download, Trash2, UploadCloud, ShieldCheck, Search, Loader2, RefreshCw, ShieldAlert, AlertTriangle, FileText, Image as ImageIcon, Video, Music, Sparkles, Share2, Copy, Check, X } from 'lucide-react';
import { useVault } from './VaultProvider';
import type { WorkerMessage, WorkerResponse } from '../workers/securityEngine.worker';

type EncryptedFile = {
  id: string;
  wrapped_key: string;
  encrypted_meta: string;
  meta_iv: string;
  file_iv: string;
  created_at: string;
};

type DecryptedMeta = {
  fileName: string;
  fileSize: number;
  fileType: string;
};

export default function VaultDashboard() {
  const { vaultKey, setVaultKey } = useVault();
  
  const [rawFiles, setRawFiles] = useState<EncryptedFile[]>([]);
  const [userPlan, setUserPlan] = useState<string>('FREE_TRIAL');
  const [metaMap, setMetaMap] = useState<Record<string, DecryptedMeta>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Selection
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Sharing State
  const [sharingFile, setSharingFile] = useState<EncryptedFile | null>(null);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [shareProgress, setShareProgress] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareExpiry, setShareExpiry] = useState('24'); // default 24 hours
  const [customExpiry, setCustomExpiry] = useState('24');
  const [sharePassword, setSharePassword] = useState('');
  const [stripMetadata, setStripMetadata] = useState(true);
  const [copied, setCopied] = useState(false);

  // AI Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);

  const workerRef = useRef<Worker | null>(null);
  
  // Refs to bridge current state to the Web Worker stale closure listeners
  const sharingFileRef = useRef(sharingFile);
  const sharePasswordRef = useRef(sharePassword);
  const shareExpiryRef = useRef(shareExpiry);
  const customExpiryRef = useRef(customExpiry);
  const metaMapRef = useRef(metaMap);
  
  sharingFileRef.current = sharingFile;
  sharePasswordRef.current = sharePassword;
  shareExpiryRef.current = shareExpiry;
  customExpiryRef.current = customExpiry;
  metaMapRef.current = metaMap;

  const decryptedQueueRef = useRef<Set<string>>(new Set());

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vault/files');
      if (res.ok) {
        const data = await res.json();
        setRawFiles(data.files || []);
      }
    } catch (e) {
      console.error("Load files error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize worker listener
  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/securityEngine.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      
      if (data.type === 'VAULT_META_RESULT') {
        setMetaMap(prev => ({
          ...prev,
          [data.fileId]: data.metadata
        }));
      }
      else if (data.type === 'VAULT_ENCRYPT_RESULT') {
        finalizeUpload(data);
      }
      else if (data.type === 'VAULT_DECRYPT_RESULT') {
        triggerFileDownload(data.decryptedBuffer, data.metadata);
      }
      else if (data.type === 'VAULT_PREPARE_SHARE_RESULT') {
        finalizeShareUpload(data);
      }
      else if (data.type === 'PROGRESS') {
        if (sharingFileRef.current) setShareProgress(data.status);
        else setUploadProgress(data.status);
      }
      else if (data.type === 'ERROR') {
        alert("Security Error: " + data.message);
        setIsUploading(false);
        setIsPreparingShare(false);
        setDownloadingId(null);
      }
    };

    loadFiles();

    // Fetch plan status
    fetch('/api/user/subscription')
      .then(res => res.json())
      .then(data => {
        if (data.plan) {
          setUserPlan(data.plan);
        }
      })
      .catch(err => console.error("Failed to load plan", err));

    return () => workerRef.current?.terminate();
  }, [loadFiles]);

  // Trigger decryption for any files that don't have metadata yet
  useEffect(() => {
    if (!vaultKey || rawFiles.length === 0) return;
    
    rawFiles.forEach(file => {
      if (!metaMap[file.id] && !decryptedQueueRef.current.has(file.id)) {
        decryptedQueueRef.current.add(file.id);
        workerRef.current?.postMessage({
          type: 'VAULT_DECRYPT_META',
          vaultKeyBase64: vaultKey,
          wrappedKeyBase64: file.wrapped_key,
          encryptedMetaBase64: file.encrypted_meta,
          metaIvBase64: file.meta_iv,
          fileId: file.id
        } as WorkerMessage);
      }
    });
  }, [rawFiles, vaultKey]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchedIds(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const itemsToSearch = rawFiles
          .filter(file => !!metaMap[file.id])
          .map(file => ({
            id: file.id,
            filename: metaMap[file.id].fileName,
            mime_type: metaMap[file.id].fileType,
            created_at: file.created_at
          }));

        const response = await fetch('/api/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            items: itemsToSearch,
            type: 'vault'
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
  }, [searchQuery, rawFiles, metaMap]);

  // UPLOADING FLOW
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vaultKey) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Beta limit: File size restricted to 50MB for browser stability.");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Reading file stream...");

    try {
      const buffer = await file.arrayBuffer();
      workerRef.current?.postMessage({
        type: 'VAULT_ENCRYPT_FILE',
        vaultKeyBase64: vaultKey,
        fileBuffer: buffer,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      } as WorkerMessage, [buffer]); // Transferable for zero-copy
    } catch (err) {
      alert("Encryption error");
      setIsUploading(false);
    }
    // Reset input
    e.target.value = '';
  };

  const finalizeUpload = async (encData: any) => {
    setUploadProgress("Finalizing secure handshake...");
    try {
      const formData = new FormData();
      // WebP / Binary append
      formData.append('file', new Blob([encData.encryptedBuffer]));
      formData.append('wrappedKey', encData.wrappedKey);
      formData.append('fileIv', encData.fileIv);
      formData.append('encryptedMetadata', encData.encryptedMeta);
      formData.append('metaIv', encData.metaIv);
      formData.append('fileSize', encData.encryptedBuffer.byteLength.toString());

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Server handshake refused");
      
      setUploadProgress("Success!");
      setTimeout(() => {
        setIsUploading(false);
        loadFiles(); // Reload list
      }, 800);
    } catch (e) {
      alert("Server upload failed.");
      setIsUploading(false);
    }
  };

  // DOWNLOADING FLOW
  const startDownload = async (file: EncryptedFile) => {
    if (downloadingId) return;
    setDownloadingId(file.id);

    try {
      const res = await fetch(`/api/vault/download/${file.id}`);
      if (!res.ok) throw new Error("Cloud fetching failed.");
      
      const encryptedBuffer = await res.arrayBuffer();
      
      workerRef.current?.postMessage({
        type: 'VAULT_DECRYPT_FILE',
        vaultKeyBase64: vaultKey!,
        encryptedFileBuffer: encryptedBuffer,
        fileIvBase64: file.file_iv,
        wrappedKeyBase64: file.wrapped_key,
        encryptedMetaBase64: file.encrypted_meta,
        metaIvBase64: file.meta_iv
      } as WorkerMessage, [encryptedBuffer]);
    } catch (e) {
      alert("Download fetch fail.");
      setDownloadingId(null);
    }
  };

  const triggerFileDownload = (decBuffer: ArrayBuffer, metadata: DecryptedMeta) => {
    setDownloadingId(null);
    const blob = new Blob([decBuffer], { type: metadata.fileType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const executeShare = async () => {
    if (!sharingFile) return;
    setIsPreparingShare(true);
    setShareProgress('Accessing physical storage...');
    setShareLink('');

    try {
      const res = await fetch(`/api/vault/download/${sharingFile.id}`);
      if (!res.ok) throw new Error("Cloud retrieval failed.");
      const encryptedBuffer = await res.arrayBuffer();
      
      setShareProgress('Decrypting and re-packing...');
      workerRef.current?.postMessage({
        type: 'VAULT_PREPARE_SHARE',
        vaultKeyBase64: vaultKey!,
        encryptedFileBuffer: encryptedBuffer,
        fileIvBase64: sharingFile.file_iv,
        wrappedKeyBase64: sharingFile.wrapped_key,
        encryptedMetaBase64: sharingFile.encrypted_meta,
        metaIvBase64: sharingFile.meta_iv,
        stripMetadata
      } as WorkerMessage, [encryptedBuffer]);
    } catch (e) {
      alert("Sharing preparation breakdown");
      setIsPreparingShare(false);
    }
  };

  const finalizeShareUpload = async (encData: any) => {
    setShareProgress('Syncing secure distribution handshake...');
    try {
      let passwordHash: string | null = null;
      const currentPwd = sharePasswordRef.current;
      if (currentPwd.trim()) {
        const encodedPwd = new TextEncoder().encode(currentPwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedPwd);
        passwordHash = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
      }

      const activeFile = sharingFileRef.current;
      if (!activeFile) {
        throw new Error("No active file reference during share processing.");
      }

      const meta = metaMapRef.current[activeFile.id];
      const formData = new FormData();
      formData.append('file', new Blob([encData.encryptedBuffer]));
      formData.append('encryptedMeta', encData.encryptedMetaBase64);
      formData.append('shareIv', encData.shareIvBase64);
      formData.append('fileSize', encData.encryptedBuffer.byteLength.toString());
      formData.append('mimeType', meta?.fileType || 'application/octet-stream');
      let expiryVal = shareExpiryRef.current;
      if (expiryVal === 'custom') {
        expiryVal = customExpiryRef.current;
        let parsed = parseInt(expiryVal);
        if (isNaN(parsed) || parsed <= 0) parsed = 24;
        if (parsed > 336) parsed = 336;
        expiryVal = parsed.toString();
      }
      formData.append('expiryHours', expiryVal);
      if (passwordHash) formData.append('passwordHash', passwordHash);

      const res = await fetch('/api/vault/share', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Distribution registration failed.");
      const data = await res.json();
      
      const base64UrlKey = encData.shareKeyBase64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const finalUrl = `${window.location.origin}/share?id=${data.shareId}#${base64UrlKey}`;
      setShareLink(finalUrl);
      setShareProgress('Secured!');
    } catch (err) {
      alert("Share storage error");
    } finally {
      setIsPreparingShare(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIconForType = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5 text-purple-400" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-pink-400" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="w-5 h-5 text-green-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };


  const displayedFiles = matchedIds === null 
    ? rawFiles 
    : matchedIds.map(id => rawFiles.find(f => String(f.id) === String(id))).filter(Boolean) as EncryptedFile[];

  const getPlanDetails = () => {
    switch (userPlan) {
      case 'CONTRACTOR':
        return { name: 'Private Contractor', limit: '50GB Secure Storage Archive', desc: 'AES-GCM zero-knowledge encryption active' };
      case 'PHANTOM':
        return { name: 'Phantom Entity', limit: '350GB Secure Storage Archive', desc: 'AES-GCM zero-knowledge encryption active' };
      case 'ENTERPRISE':
        return { name: 'Enterprise Core', limit: '4TB Sovereign Archival Storage', desc: 'AES-GCM zero-knowledge encryption active' };
      case 'FREE_TRIAL':
      default:
        return { name: 'Free Trial', limit: '100MB Limited Trial Vault', desc: 'Upgrade for premium storage capacity' };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1815]/95 border border-[#d4af37]/15 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#d4af37]/10 rounded-xl border border-[#d4af37]/25">
            <ShieldCheck className="w-6 h-6 text-[#e5c158]" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black uppercase text-white flex items-center gap-2 flex-wrap tracking-wider">
              StealthBox Vault
              <span className="bg-[#4ade80]/10 text-[#4ade80] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#4ade80]/25">AES-256 SECURED</span>
              <span className="bg-[#d4af37]/10 text-[#e5c158] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#d4af37]/25">{planDetails.name}</span>
            </h1>
            <p className="text-slate-350 text-sm mt-1 font-bold">Localized CryptoSession active • {planDetails.limit} • {planDetails.desc}</p>
          </div>
        </div>

        <button 
          onClick={() => setVaultKey(null)}
          className="px-4 py-2.5 bg-[#24211c] hover:bg-[#322d26] border border-[#d4af37]/15 rounded-lg text-slate-300 hover:text-white text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center font-mono"
        >
          <Lock className="w-4 h-4 mr-2" /> Lock Session
        </button>
      </div>

      {/* Upload Zone */}
      <div className="relative group">
        <input 
          type="file" 
          id="vault-uploader" 
          className="hidden" 
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <label 
          htmlFor="vault-uploader"
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${isUploading ? 'border-[#d4af37]/50 bg-[#d4af37]/5 pointer-events-none' : 'border-[#d4af37]/20 bg-[#0d0c0a] hover:bg-[#1a1815]/50 hover:border-[#d4af37]/35'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center text-[#e5c158] animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-bold uppercase tracking-wider">{uploadProgress}</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-slate-400 mb-3 group-hover:text-[#e5c158] transition-colors" />
              <p className="text-sm text-slate-350 font-bold uppercase tracking-wide">Click or drag to drop local files</p>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Maximum safety: Encrypted entirely in client browser memory before sending.</p>
            </>
          )}
        </label>
      </div>

      {/* Files Table */}
      <div className="bg-[#1a1815]/95 border border-[#d4af37]/15 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#d4af37]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-display font-black text-white uppercase tracking-wider flex items-center text-sm shrink-0">
            Stored Items
            <span className="ml-3 bg-[#d4af37]/10 px-2 py-0.5 rounded font-mono text-[10px] text-[#e5c158] border border-[#d4af37]/15 font-bold">{rawFiles.length}</span>
          </h3>

          <div className="flex-grow max-w-md relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#e5c158] animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#e5c158]" />
              )}
            </div>
            <input
              type="text"
              placeholder="AI Search: 'bank statement', 'photo from may'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-[#d4af37]/15 focus:border-[#d4af37]/50 rounded-xl pl-10 pr-4 py-2 text-xs font-sans text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#d4af37]/10 transition-all"
            />
          </div>

          <button onClick={loadFiles} className="text-slate-400 hover:text-white transition-colors shrink-0 ml-auto md:ml-0" title="Refresh index">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#24211c]/60 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-[#d4af37]/10">
              <tr>
                <th className="px-6 py-3.5">Resource Name</th>
                <th className="px-6 py-3.5">Size</th>
                <th className="px-6 py-3.5">Uploaded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && rawFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-300">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#e5c158]" />
                    Scanning Cloud Index...
                  </td>
                </tr>
              )}
              
              {!isLoading && displayedFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                      {matchedIds ? <Search className="w-6 h-6 text-[#e5c158]/50" /> : <File className="w-6 h-6" />}
                    </div>
                    <p className="text-slate-200 text-base font-bold uppercase">
                      {matchedIds ? "No semantic matches found" : "No files found"}
                    </p>
                    <p className="text-slate-450 text-xs mt-1">
                      {matchedIds ? "Try searching for keywords, file extensions, or dates." : "Your persistent vault is currently empty."}
                    </p>
                  </td>
                </tr>
              )}

              {displayedFiles.map((file) => {
                const meta = metaMap[file.id];
                const isReady = !!meta;
                const isWorking = downloadingId === file.id;

                return (
                  <tr key={file.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-[#141310] rounded-lg border border-[#d4af37]/15 group-hover:border-[#d4af37]/35 transition-colors">
                          {isReady ? getIconForType(meta.fileType) : <Lock className="w-5 h-5 text-amber-500 opacity-50" />}
                        </div>
                        <div>
                          {isReady ? (
                            <div className="text-white font-bold">{meta.fileName}</div>
                          ) : (
                            <div className="h-4 w-32 bg-white/10 animate-pulse rounded flex items-center">
                              <span className="text-[9px] text-slate-350 ml-2 font-mono">Unwrapping...</span>
                            </div>
                          )}
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">{file.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs font-mono font-bold">
                      {isReady ? formatBytes(meta.fileSize) : "---"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs font-medium">
                      {new Date(file.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startDownload(file)}
                        disabled={isWorking || !isReady}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${isReady ? 'bg-[#d4af37]/10 hover:bg-[#d4af37] hover:text-[#141310] text-[#e5c158] border border-[#d4af37]/25' : 'bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                      >
                        {isWorking ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#141310]" />
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-1.5" /> Download
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSharingFile(file);
                          setShareLink('');
                          setShareProgress('');
                          setStripMetadata(true);
                          setCopied(false);
                        }}
                        disabled={!isReady}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${isReady ? 'bg-[#4ade80]/15 hover:bg-[#4ade80] hover:text-[#141310] text-[#4ade80] border border-[#4ade80]/30' : 'bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                      >
                        <Share2 className="w-3 h-3 mr-1.5" /> Share
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Overlay */}
      {sharingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1815]/95 border border-[#d4af37]/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#d4af37]/10 flex items-center justify-between bg-white/[0.01]">
              <h3 className="text-base font-display font-black uppercase text-white flex items-center tracking-wider">
                <Share2 className="w-4 h-4 mr-2 text-[#e5c158]" /> Secure File Share
              </h3>
              <button 
                onClick={() => setSharingFile(null)} 
                disabled={isPreparingShare}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Resource to share</p>
                <div className="bg-[#0d0c0a] border border-[#d4af37]/10 rounded-lg p-3 flex items-center">
                  {getIconForType(metaMap[sharingFile.id]?.fileType)}
                  <div className="ml-3">
                    <div className="text-sm text-white font-bold truncate max-w-[280px]">
                      {metaMap[sharingFile.id]?.fileName || 'Decrypting metadata...'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">
                      {formatBytes(metaMap[sharingFile.id]?.fileSize || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {!shareLink ? (
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Auto-Destruct</label>
                        <select
                          value={shareExpiry}
                          onChange={(e) => setShareExpiry(e.target.value)}
                          disabled={isPreparingShare}
                          className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#d4af37]/45 transition-all"
                        >
                          <option value="3" className="bg-[#141310]">3 Hours</option>
                          <option value="24" className="bg-[#141310]">24 Hours</option>
                          <option value="72" className="bg-[#141310]">3 Days</option>
                          <option value="168" className="bg-[#141310]">7 Days</option>
                          <option value="custom" className="bg-[#141310]">Manual Time</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Access Password</label>
                        <input
                          type="password"
                          value={sharePassword}
                          onChange={(e) => setSharePassword(e.target.value)}
                          disabled={isPreparingShare}
                          placeholder="Strong passphrase"
                          className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-605 focus:outline-none focus:border-[#d4af37]/45 transition-all"
                        />
                      </div>
                    </div>

                    {shareExpiry === 'custom' && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Manual Expiry (Hours) — Max 336h</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="336"
                            value={customExpiry}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomExpiry(val);
                            }}
                            disabled={isPreparingShare}
                            placeholder="e.g., 48"
                            className="w-full bg-[#141310] border border-[#d4af37]/15 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4af37]/45 transition-all font-mono"
                          />
                          <span className="text-xs text-slate-455 shrink-0">Hours</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5 bg-[#4ade80]/5 border border-[#4ade80]/15 rounded-xl p-3 mt-1">
                    <input
                      type="checkbox"
                      id="vaultStripExif"
                      checked={stripMetadata}
                      onChange={(e) => setStripMetadata(e.target.checked)}
                      disabled={isPreparingShare}
                      className="w-4 h-4 accent-[#4ade80] rounded cursor-pointer bg-slate-900 border-white/10 shrink-0 mt-0.5"
                    />
                    <label htmlFor="vaultStripExif" className="flex-1 cursor-pointer select-none">
                      <p className="text-xs font-semibold text-[#4ade80] flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#4ade80]" /> Purge EXIF / Metadata
                      </p>
                      <p className="text-[10px] text-[#4ade80]/70 mt-0.5 leading-relaxed">
                        Destroys all location coordinates, camera signatures, and creator information inside browser memory.
                      </p>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#e5c158]/70 shrink-0 mt-0.5" />
                    <span>
                      We'll re-encrypt the file using a brand-new ephemeral key. The decryption secret will reside solely in the link anchor hash, ensuring perfect zero-knowledge.
                    </span>
                  </p>

                  <button
                    onClick={executeShare}
                    disabled={isPreparingShare || !metaMap[sharingFile.id]}
                    className="w-full mt-2 flex items-center justify-center bg-gradient-to-r from-[#d4af37] to-[#e5c158] hover:from-[#e5c158] hover:to-[#d4af37] text-[#141310] font-black uppercase tracking-[0.1em] text-xs py-3 px-4 rounded-xl transition-all border border-[#d4af37]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPreparingShare ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-2 text-[#141310]" />
                        {shareProgress || 'Generating Ephemeral Keys...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-2" /> Generate Secure Share Link
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl flex items-center gap-2 text-[#4ade80]">
                    <ShieldCheck className="w-4 h-4 text-[#4ade80] shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Link Generated Securely!</span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Encrypted Transmission Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareLink}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-[#e5c158] select-all focus:outline-none focus:border-[#d4af37]/50"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="px-3 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e5c158] text-[#141310] border border-[#d4af37]/20 transition-all flex items-center justify-center shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 p-2.5 bg-white/5 border border-white/5 rounded-lg">
                    <strong className="text-slate-200 block mb-0.5 uppercase tracking-wider text-[10px]">Security Notice</strong>
                    The anchor portion (`#key`) contains the cryptographic key. It is not sent to our servers. If you lose this link, the recipient will never be able to decrypt the file.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
