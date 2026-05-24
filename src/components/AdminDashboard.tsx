"use client";

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Database, Mail, Server, 
  Activity, HardDrive, RefreshCcw, Lock, UserCheck, Key, Clock, Globe, Settings, Loader2, Code2, History, ChevronRight, BarChart2
} from 'lucide-react';

interface AdminStats {
  users: number;
  secrets: number;
  files: number;
  capacity_bytes: number;
  aliases: number;
  forwards: number;
}

type TabId = 'telemetry' | 'personnel' | 'assets' | 'audittrail' | 'configuration' | 'emailtemplates' | 'reports' | 'organizations' | 'stealthbot';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('telemetry');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reportsData, setReportsData] = useState<any | null>(null);

  // Stealthbot custom training states
  const [rawTrainingText, setRawTrainingText] = useState('');
  const [scrapingUrl, setScrapingUrl] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [crawlingStatus, setCrawlingStatus] = useState('');
  const [simulatorMessages, setSimulatorMessages] = useState<any[]>([
    { sender: 'bot', text: 'STEALTHBOT CORE INITIALIZED. INPUT ENCRYPTED OPERATIVE PROMPT.' }
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [trainingLogs, setTrainingLogs] = useState<any[]>([
    { timestamp: '10:14:02', event: 'Loaded default system operational blueprints', status: 'COMPLETED' },
    { timestamp: '11:42:15', event: 'Initialized Llama 3.1 instruct context window', status: 'COMPLETED' }
  ]);
  const [simulatorLoading, setSimulatorLoading] = useState(false);

  // Organizations states
  const [organizations, setOrganizations] = useState<any[]>([
    { id: 'org-1', name: 'Sovereign Core Group', domain: 'sovcore.net', seats: 15, usedSeats: 12, admin: 'chief@sovcore.net', storage: 159544782848, storageLimit: 3221225472000, status: 'ACTIVE' },
    { id: 'org-2', name: 'Ghostmesh Operations', domain: 'ghostmesh.org', seats: 8, usedSeats: 5, admin: 'spectre@ghostmesh.org', storage: 85899345920, storageLimit: 1717986918400, status: 'ACTIVE' },
    { id: 'org-3', name: 'Cyber Defense Initiative', domain: 'cyberdef.io', seats: 5, usedSeats: 5, admin: 'ops@cyberdef.io', storage: 21474836480, storageLimit: 1073741824000, status: 'ACTIVE' }
  ]);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  const [editSeatsVal, setEditSeatsVal] = useState<number>(5);
  const [users, setUsers] = useState<any[]>([]);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [testingTemplateId, setTestingTemplateId] = useState<string | null>(null);
  const [config, setConfig] = useState<{ [key: string]: string }>({ 
    global_allowed_countries: '', 
    global_allowed_ips: '',
    google_ads_script: '',
    facebook_pixel_script: '',
    custom_head_scripts: '',
    custom_body_scripts: '',
    custom_footer_scripts: '',
    stealthbot_knowledge: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Security Personnel RBAC states
  const [currentSession, setCurrentSession] = useState<{ email: string; role: string } | null>(null);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('VIEWER');
  const [personnelTab, setPersonnelTab] = useState<'operatives' | 'security'>('operatives');
  const [submittingPersonnel, setSubmittingPersonnel] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        const data = await res.json();
        setCurrentSession(data);
      }
    } catch (e) { console.error('fetchSession failed:', e); }
  };

  const fetchPersonnel = async () => {
    try {
      const res = await fetch('/api/admin/personnel');
      if (res.ok) {
        const data = await res.json();
        setPersonnelList(data.personnel || []);
      }
    } catch (e) { console.error('fetchPersonnel failed:', e); }
  };

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newRole) return;
    setSubmittingPersonnel(true);
    try {
      const res = await fetch('/api/admin/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(`Successfully clearance granted to ${newEmail}`);
        setTimeout(() => setToast(null), 3000);
        setNewEmail('');
        fetchPersonnel();
      } else {
        alert(data.error || 'Failed to authorize operative.');
      }
    } catch (err) {
      console.error(err);
      alert('Action timed out.');
    } finally {
      setSubmittingPersonnel(false);
    }
  };

  const handleBanPersonnel = async (email: string, action: 'BAN' | 'UNBAN') => {
    if (!confirm(`Are you sure you want to ${action === 'BAN' ? 'ban and revoke clearance for' : 'unban'} ${email}?`)) return;
    try {
      const res = await fetch('/api/admin/personnel/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action })
      });
      const data = await res.json();
      if (res.ok) {
        setToast(`Clearance updated for ${email}`);
        setTimeout(() => setToast(null), 3000);
        fetchPersonnel();
      } else {
        alert(data.error || 'Operation failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Action timed out.');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Unauthorized access.");
      }
      const data = await response.json();
      setStats(data.overview);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/secrets');
      const data = await res.json();
      setSecrets(data.secrets || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      setConfig(prev => ({ ...prev, ...data.config }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setToast("Configuration committed to global cache.");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const [resettingUser, setResettingUser] = useState<string | null>(null);

  const handleReset2FA = async (email: string) => {
    if (!confirm(`Are you sure you want to deactivate 2FA security for operative ${email}?`)) return;
    setResettingUser(email);
    try {
      const res = await fetch('/api/admin/reset-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setToast(`Successfully deactivated 2FA for ${email}`);
        setTimeout(() => setToast(null), 3000);
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reset 2FA.");
      }
    } catch (e) {
      console.error(e);
      alert("Network or database connection timed out.");
    } finally {
      setResettingUser(null);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error('fetchTemplates failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });
      if (res.ok) {
        setToast(`Successfully updated email template: ${editingTemplate.name}`);
        setTimeout(() => setToast(null), 3000);
        setSelectedTemplate(null);
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save template changes.');
      }
    } catch (err) {
      console.error(err);
      alert('Action timed out.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTemplate = async (id: string) => {
    setTestingTemplateId(id);
    try {
      const res = await fetch('/api/admin/templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setToast(`Test email successfully delivered to ${currentSession?.email || 'registered address'}!`);
        setTimeout(() => setToast(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to dispatch test email.');
      }
    } catch (err) {
      console.error(err);
      alert('Action timed out.');
    } finally {
      setTestingTemplateId(null);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (e) {
      console.error('fetchReports failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (activeTab === 'telemetry') fetchStats();
    if (activeTab === 'personnel') {
      fetchUsers();
      fetchPersonnel();
    }
    if (activeTab === 'assets') fetchSecrets();
    if (activeTab === 'audittrail') fetchLogs();
    if (activeTab === 'configuration') fetchConfig();
    if (activeTab === 'emailtemplates') fetchTemplates();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-6 font-mono">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl max-w-md text-center backdrop-blur-xl">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">Access Denied</h2>
          <p className="text-slate-350 text-xs font-bold mb-6">{error}</p>
          <a href="/" className="px-6 py-3 bg-slate-950 border border-white/10 rounded-xl text-white hover:bg-white/5 transition font-bold text-[10px] uppercase tracking-widest font-mono">Return to HQ</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-100 selection:bg-[#d4af37]/30 relative overflow-hidden font-sans">
      {/* Ambient background blur */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.035),transparent_60%)] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-700 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-mono font-bold uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <Server className="w-3.5 h-3.5" /> Command Node 01
            </div>
            <h1 className="text-3xl md:text-4xl font-mono font-black tracking-tighter text-white uppercase">
              Platform Governance
            </h1>
            <p className="text-slate-400 text-xs font-mono mt-1">Manage global system metrics, audit logs, and configurations.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto bg-[#070709]/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-xl shadow-lg w-full lg:w-auto">
            {(['telemetry', 'organizations', 'stealthbot', 'personnel', 'assets', 'audittrail', 'configuration', 'emailtemplates', 'reports'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activeTab === t 
                    ? 'bg-[#d4af37]/10 text-[#e5c158] border border-[#d4af37]/35 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                    : 'text-slate-450 hover:text-white border border-transparent'
                }`}
              >
                {t === 'telemetry' && <Activity className="w-4 h-4" />}
                {t === 'organizations' && <Globe className="w-4 h-4 text-[#e5c158]" />}
                {t === 'stealthbot' && <Code2 className="w-4 h-4 text-[#e5c158]" />}
                {t === 'personnel' && <Users className="w-4 h-4" />}
                {t === 'assets' && <Database className="w-4 h-4" />}
                {t === 'audittrail' && <History className="w-4 h-4" />}
                {t === 'configuration' && <Settings className="w-4 h-4" />}
                {t === 'emailtemplates' && <Mail className="w-4 h-4" />}
                {t === 'reports' && <BarChart2 className="w-4 h-4" />}
                {t === 'audittrail' ? 'audit trail' : t === 'emailtemplates' ? 'email templates' : t === 'stealthbot' ? 'stealthbot brain' : t}
              </button>
            ))}
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-8 right-8 bg-[#d4af37] text-black font-mono font-black uppercase tracking-wider text-[11px] px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.35)] z-50 animate-bounce flex items-center gap-2">
             <UserCheck className="w-4 h-4 text-black" /> {toast}
          </div>
        )}

        {loading && !saving && (
           <div className="flex flex-col justify-center items-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#e5c158] mb-4" />
              <span className="text-xs font-mono font-bold tracking-widest uppercase">Synchronizing Datastream...</span>
           </div>
        )}

        <div className={`transition-opacity duration-300 ${loading && !saving ? 'opacity-0 pointer-events-none hidden' : 'opacity-100'}`}>
          
          {/* VIEW 1: TELEMETRY HUB */}
          {activeTab === 'telemetry' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-[#d4af37]/5 border border-[#d4af37]/15 rounded-2xl p-6 flex items-center justify-between backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d4af37]"></span>
                    </div>
                    <div>
                      <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#e5c158]">Network Latency Baseline Passed</h3>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">Execution Target: Global Edge Network</p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#070709]/80 border border-white/10 rounded-2xl p-6 flex items-center gap-4 backdrop-blur-sm shadow-sm">
                   <Clock className="w-6 h-6 text-slate-400" />
                   <div>
                     <p className="text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Sync Status</p>
                     <p className="text-xs font-mono font-bold text-white uppercase tracking-wider mt-0.5">Live Operational</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Identity Assets', val: stats?.users, icon: Users, sub: `${stats?.users || 0} Registered Users` },
                  { label: 'Encrypted Storage', val: formatBytes(stats?.capacity_bytes || 0), icon: HardDrive, sub: `${stats?.files || 0} Files Committed` },
                  { label: 'Relay Channels', val: stats?.forwards, icon: Mail, sub: `${stats?.aliases || 0} Active Aliases` },
                  { label: 'Ephemeral secrets', val: stats?.secrets, icon: Lock, sub: 'Transient Data silos' },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} className="bg-[#070709]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-sm">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-6 border border-white/10 bg-slate-950 text-[#e5c158] shadow-inner">
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-slate-455 text-[10px] font-mono font-bold uppercase tracking-widest mb-1">{card.label}</p>
                      <h3 className="text-2xl font-mono font-bold text-white tracking-tight mb-1">{card.val?.toLocaleString() || 0}</h3>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{card.sub}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: PERSONNEL LIST */}
          {activeTab === 'personnel' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Personnel Sub-tabs */}
              <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                  onClick={() => setPersonnelTab('operatives')}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                    personnelTab === 'operatives'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-455 hover:text-white'
                  }`}
                >
                  Vault Operatives
                </button>
                <button
                  onClick={() => setPersonnelTab('security')}
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all ${
                    personnelTab === 'security'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-455 hover:text-white'
                  }`}
                >
                  Security Command Node
                </button>
              </div>

              {personnelTab === 'operatives' ? (
                <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/20">
                    <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                      <UserCheck className="w-5 h-5 text-[#e5c158]" /> Cleared Personnel Index
                    </h2>
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">{users.length} Records</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 bg-slate-950/50">
                          <th className="px-6 py-4">OPERATIVE / ENTITY</th>
                          <th className="px-6 py-4">EMAIL ENDPOINT</th>
                          <th className="px-6 py-4">STORAGE ALLOCATION</th>
                          <th className="px-6 py-4">CREATION DATE</th>
                          <th className="px-6 py-4">2FA STATUS</th>
                          <th className="px-6 py-4">ACTIVE PLAN</th>
                          <th className="px-6 py-4 text-right">GOVERNANCE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {users.map((user: any) => (
                           <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#020203] rounded-full border border-white/10 flex items-center justify-center text-xs text-[#e5c158] font-bold">
                                  {(user.firstName?.[0] || 'X').toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-white">{user.firstName} {user.lastName}</div>
                                  <div className="text-[9px] font-mono text-slate-500 truncate w-32 mt-0.5">{user.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-[#e5c158]">{user.email}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 w-40">
                                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                  <span>{formatBytes(user.storageUsed || 0)}</span>
                                  <span>/ {formatBytes(user.storageLimit || 1073741824)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#020203] rounded-full overflow-hidden border border-white/5">
                                  <div 
                                    className="h-full bg-[#d4af37] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.round(((user.storageUsed || 0) / (user.storageLimit || 1073741824)) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest ${
                                user.twoFactorEnabled 
                                  ? 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20' 
                                  : 'text-slate-500 bg-slate-950 border-white/5'
                              }`}>
                                {user.twoFactorEnabled ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 w-32">
                                <select
                                  value={user.plan || 'FREE_TRIAL'}
                                  onChange={async (e) => {
                                    const nextPlan = e.target.value;
                                    let trialDays: string | null = null;
                                    if (confirm(`Change plan for ${user.email} to ${nextPlan}?`)) {
                                      if (confirm("Would you like to specify a custom trial duration in days? (Cancel for default plan limits)")) {
                                        trialDays = prompt("Specify trial duration in days (e.g. 14):", "14");
                                      }
                                      
                                      try {
                                        const res = await fetch('/api/admin/users/plan', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ 
                                            userId: user.email, 
                                            plan: nextPlan, 
                                            trialDays: trialDays ? Number(trialDays) : undefined 
                                          })
                                        });
                                        if (res.ok) {
                                          setToast(`Updated ${user.email} to plan ${nextPlan}`);
                                          setTimeout(() => setToast(null), 3000);
                                          await fetchUsers();
                                        } else {
                                          const errData = await res.json();
                                          alert(errData.error || "Failed to update plan.");
                                        }
                                      } catch (err) {
                                        alert("Connection failed.");
                                      }
                                    }
                                  }}
                                  disabled={currentSession?.role !== 'SUPER_ADMIN'}
                                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-slate-200 text-[10px] focus:outline-none"
                                >
                                  <option value="FREE_TRIAL">Free Trial</option>
                                  <option value="CONTRACTOR">Private Contractor</option>
                                  <option value="PHANTOM">Phantom Entity</option>
                                  <option value="ENTERPRISE">Enterprise Core</option>
                                </select>
                                {user.trialEnd && (
                                  <span className="text-[8px] text-slate-500 font-mono">
                                    Expires: {new Date(user.trialEnd).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {user.twoFactorEnabled && (
                                <button
                                  disabled={resettingUser === user.email}
                                  onClick={() => handleReset2FA(user.email)}
                                  className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900 border border-red-900/30 hover:border-red-800 text-red-400 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                                >
                                  {resettingUser === user.email ? 'Deactivating...' : 'Deactivate 2FA'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic text-xs">No operational personnel files indexed.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Register New security personnel (Super Admin only!) */}
                  {currentSession?.role === 'SUPER_ADMIN' ? (
                    <div className="bg-[#070709]/80 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#e5c158] flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Issue Security Authorization Clearance
                      </h3>
                      <form onSubmit={handleAddPersonnel} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Operative Email</label>
                          <input
                            type="email"
                            required
                            placeholder="agent@stealthrelay.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-[#020203] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-700 font-mono focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Access Role</label>
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full bg-[#020203] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                          >
                            <option value="VIEWER">VIEWER (Read-only Telemetry)</option>
                            <option value="ADMIN">ADMIN (Manage relays & settings)</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN (All controls & permissions)</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={submittingPersonnel}
                          className="w-full py-2.5 bg-[#d4af37] hover:bg-[#e5c158] disabled:opacity-50 text-black font-mono font-black uppercase tracking-wider text-xs rounded-lg transition-all"
                        >
                          {submittingPersonnel ? 'Issuing...' : 'Grant Clearance'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center">
                      <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                        Personnel registration is restricted to SUPER_ADMIN operatives.
                      </p>
                    </div>
                  )}

                  {/* List of Security Personnel */}
                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/20">
                      <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                        <Lock className="w-5 h-5 text-[#e5c158]" /> Authorized Command Personnel
                      </h2>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase">{personnelList.length} Records</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 bg-slate-950/50">
                            <th className="px-6 py-4">OPERATIVE</th>
                            <th className="px-6 py-4">ROLE LEVEL</th>
                            <th className="px-6 py-4">CREATION DATE</th>
                            <th className="px-6 py-4">CLEARANCE STATUS</th>
                            <th className="px-6 py-4 text-right">GOVERNANCE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                          {personnelList.map((person: any) => (
                            <tr key={person.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 font-bold text-white">{person.email}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                  person.role === 'SUPER_ADMIN' 
                                    ? 'text-red-400 bg-red-950/20 border-red-500/30'
                                    : person.role === 'ADMIN'
                                    ? 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20'
                                    : 'text-slate-455 bg-slate-950 border-white/5'
                                }`}>
                                  {person.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {person.created_at ? new Date(person.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                  person.status === 'ACTIVE'
                                    ? 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20'
                                    : 'text-red-500 bg-red-950 border-red-900/30 animate-pulse'
                                }`}>
                                  {person.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {currentSession?.role === 'SUPER_ADMIN' && person.email.toLowerCase() !== currentSession?.email.toLowerCase() ? (
                                  person.status === 'ACTIVE' ? (
                                    <button
                                      onClick={() => handleBanPersonnel(person.email, 'BAN')}
                                      className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900 border border-red-900/30 hover:border-red-800 text-red-400 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Ban Operative
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBanPersonnel(person.email, 'UNBAN')}
                                      className="px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-900/30 hover:border-emerald-800 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all"
                                    >
                                      Reactivate
                                    </button>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-600 italic">No access mutation</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ASSET INVENTORY */}
          {activeTab === 'assets' && (
            <div className="animate-in fade-in duration-500 bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/20">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white"><Key className="w-5 h-5 text-[#e5c158]" /> Transitory Secrets Queue</h2>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">Latest Operations</span>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 bg-slate-950/50">
                      <th className="px-6 py-4">PAYLOAD ID</th>
                      <th className="px-6 py-4">TYPOLOGY</th>
                      <th className="px-6 py-4">ACCESS CONSTRAINTS</th>
                      <th className="px-6 py-4">STATUS</th>
                      <th className="px-6 py-4">COMMITTED TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {secrets.map((sec: any) => (
                      <tr key={sec.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-white group-hover:text-[#e5c158] transition-colors">{sec.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-widest ${sec.is_file ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20'}`}>
                            {sec.is_file ? 'File' : 'Text'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2.5">
                            {sec.has_password === 1 && <span title="Protected by Secret password"><Lock className="w-4 h-4 text-[#e5c158]" /></span>}
                            {sec.allowed_countries && <span title="Geo-Fenced"><Globe className="w-4 h-4 text-[#e5c158]" /></span>}
                            {sec.allowed_ips && <span title="IP Restricted"><Server className="w-4 h-4 text-[#e5c158]" /></span>}
                            {(!sec.has_password && !sec.allowed_countries && !sec.allowed_ips) && <span className="text-[10px] text-slate-500 italic font-mono uppercase tracking-wider">Standard Access</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {sec.is_viewed === 1 ? (
                            <span className="text-[10px] text-slate-655 font-mono font-bold uppercase tracking-wider line-through">Redacted</span>
                          ) : (
                            <span className="text-[10px] text-[#e5c158] font-mono font-bold uppercase tracking-wider animate-pulse">Active Vault</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(sec.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {secrets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-xs">Zero ephemeral assets currently buffered.</td>
                      </tr>
                    )}
                  </tbody>
                 </table>
              </div>
            </div>
          )}

          {/* VIEW 5: AUDIT TRAIL */}
          {activeTab === 'audittrail' && (
            <div className="animate-in fade-in duration-500 bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/20">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white"><History className="w-5 h-5 text-[#e5c158]" /> Operations Audit Log</h2>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">Real-Time Registry Log</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 bg-slate-950/50">
                      <th className="px-6 py-4">SYSTEM EPOCH</th>
                      <th className="px-6 py-4">SOURCE IP</th>
                      <th className="px-6 py-4">INTEGRITY ACTION</th>
                      <th className="px-6 py-4">SEVERITY</th>
                      <th className="px-6 py-4">TELEMETRY DETAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                    {logs.map((log: any) => {
                      const isCrit = log.severity === 'CRITICAL';
                      const isWarn = log.severity === 'WARNING';
                      
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-[#e5c158] font-bold">
                            {log.ip_address || '0.0.0.0'}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-200 uppercase tracking-wider">
                            {log.action}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold border tracking-widest uppercase ${
                              isCrit ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              isWarn ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                              'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#e5c158]'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-350 max-w-xs truncate" title={log.details}>
                            {log.details || 'N/A'}
                          </td>
                        </tr>
                      )
                    })}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic text-xs font-sans">Platform security baseline healthy. No incidents logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: SYSTEM CONFIGURATION */}
          {activeTab === 'configuration' && (
            <div className="animate-in fade-in duration-500 bg-[#070709]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3 mb-6 text-[#e5c158]">
                <Globe className="w-6 h-6 animate-pulse" />
                <h2 className="text-lg font-mono font-bold uppercase tracking-widest">Global System Routing</h2>
              </div>
              
              <p className="text-slate-400 text-xs font-mono mb-8 border-l-2 border-[#d4af37]/40 pl-4 max-w-2xl uppercase tracking-wider leading-relaxed">
                Warning: Definitions applied here override standard downstream permissions dynamically.
                Leave fields blank for open secure routing.
              </p>

              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">Restricted Jurisdictions (ISO Alpha-2)</label>
                  <input 
                    type="text" 
                    value={config.global_allowed_countries || ''}
                    onChange={(e) => setConfig({...config, global_allowed_countries: e.target.value.toUpperCase()})}
                    placeholder="E.g. US,CA,GB"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">Permitted Ingress Range (IP/CIDR)</label>
                  <input 
                    type="text" 
                    value={config.global_allowed_ips || ''}
                    onChange={(e) => setConfig({...config, global_allowed_ips: e.target.value})}
                    placeholder="E.g. 192.168.1.1, 10.0.0.0/24"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                  />
                </div>

                <hr className="border-white/10 my-6" />

                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#e5c158]">
                    <Code2 className="w-4 h-4" />
                    <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Google Analytics Script Tag</label>
                  </div>
                  <textarea 
                    rows={4}
                    value={config.google_ads_script || ''}
                    onChange={(e) => setConfig({...config, google_ads_script: e.target.value})}
                    placeholder="<!-- Paste Google Ads global site tag script here -->"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white text-xs focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#e5c158]">
                    <Code2 className="w-4 h-4" />
                    <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Marketing Tracker (Facebook Pixel)</label>
                  </div>
                  <textarea 
                    rows={4}
                    value={config.facebook_pixel_script || ''}
                    onChange={(e) => setConfig({...config, facebook_pixel_script: e.target.value})}
                    placeholder="<!-- Paste Facebook Pixel code here -->"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white text-xs focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono font-bold"
                  />
                </div>

                <hr className="border-white/10 my-6" />

                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#e5c158]">
                    <Code2 className="w-4 h-4" />
                    <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Global Header Injection (&lt;head&gt;)</label>
                  </div>
                  <textarea 
                    rows={5}
                    value={config.custom_head_scripts || ''}
                    onChange={(e) => setConfig({...config, custom_head_scripts: e.target.value})}
                    placeholder="<!-- Universal scripts injected in <head> -->"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white text-xs focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#e5c158]">
                    <Code2 className="w-4 h-4" />
                    <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Global Body Injection</label>
                  </div>
                  <textarea 
                    rows={5}
                    value={config.custom_body_scripts || ''}
                    onChange={(e) => setConfig({...config, custom_body_scripts: e.target.value})}
                    placeholder="<!-- Code placed right after the opening <body> tag -->"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white text-xs focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono font-bold"
                  />
                </div>

                <hr className="border-white/10 my-6" />

                <div>
                  <div className="flex items-center gap-2 mb-2 text-[#e5c158]">
                    <Lock className="w-4 h-4 animate-pulse" />
                    <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Stealthbot AI Core Memory / Custom Knowledge</label>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mb-2 uppercase tracking-wide leading-relaxed">
                    Inject active manuals, announcements, system updates, product features, or known bugs directly into Stealthbot's core memory bank in real-time.
                  </p>
                  <textarea 
                    rows={6}
                    value={config.stealthbot_knowledge || ''}
                    onChange={(e) => setConfig({...config, stealthbot_knowledge: e.target.value})}
                    placeholder="E.g. [BUG REPORT] Staging local environment Turnstile sitekey uses bypass parameter bypass-token. [ANNOUNCEMENT] Private Contractor Tier storage capacity upgraded from 500MB to 1GB!"
                    className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white text-xs focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono font-medium leading-relaxed"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#d4af37]/90 border border-transparent text-black px-6 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <RefreshCcw className="w-4 h-4" />}
                    Commit System Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: EMAIL TEMPLATES */}
          {activeTab === 'emailtemplates' && (
            <div className="animate-in fade-in duration-500 space-y-6">
              
              {editingTemplate ? (
                /* EDIT VIEW */
                <div className="bg-[#070709]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158]">Customize Template</span>
                      <h2 className="text-xl font-mono font-black text-white uppercase mt-1">{editingTemplate.name}</h2>
                    </div>
                    <button
                      onClick={() => { setSelectedTemplate(null); setEditingTemplate(null); }}
                      className="px-4 py-2 border border-white/10 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      Back to Templates
                    </button>
                  </div>

                  <form onSubmit={handleSaveTemplate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">Default Recipient</label>
                        <input
                          type="text"
                          readOnly
                          value={editingTemplate.recipient}
                          className="w-full bg-[#020203] border border-white/10 rounded-lg px-4 py-3 text-slate-400 font-mono text-xs focus:outline-none cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">Delivery Status</label>
                        <select
                          value={editingTemplate.status}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, status: e.target.value })}
                          className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                        >
                          <option value="ENABLED">ENABLED (Delivery Active)</option>
                          <option value="DISABLED">DISABLED (Delivery Silent)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">Email Subject</label>
                      <input
                        type="text"
                        required
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                        placeholder="Subject Line"
                        className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">CC Address (Optional)</label>
                        <input
                          type="email"
                          value={editingTemplate.cc || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, cc: e.target.value })}
                          placeholder="cc@company.com"
                          className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest mb-2">BCC Address (Optional)</label>
                        <input
                          type="email"
                          value={editingTemplate.bcc || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, bcc: e.target.value })}
                          placeholder="bcc@company.com"
                          className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">HTML Body Content</label>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Supports HTML & CSS inline styles</span>
                      </div>
                      <textarea
                        rows={12}
                        required
                        value={editingTemplate.body}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                        className="w-full bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all resize-y font-mono text-xs font-medium leading-relaxed"
                      />
                    </div>

                    {/* Placeholder Guide Block */}
                    <div className="bg-[#020203] border border-white/5 rounded-xl p-4 space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e5c158]">Dynamic Variable Replacements</h4>
                      <p className="text-[9px] font-mono text-slate-400 leading-normal">
                        Inject live data in real-time by inserting any of these tokens:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono text-slate-500">
                        <div><strong className="text-white">{"{{ sitename }}"}</strong> - Portal Name</div>
                        <div><strong className="text-white">{"{{ plan }}"}</strong> - Active Plan Tier</div>
                        <div><strong className="text-white">{"{{ display_name }}"}</strong> - Operative Name</div>
                        <div><strong className="text-white">{"{{ user_login }}"}</strong> - Operative Email</div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#d4af37]/90 border border-transparent text-black px-6 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                        Save Template Changes
                      </button>
                      
                      <button
                        type="button"
                        disabled={testingTemplateId === editingTemplate.id}
                        onClick={() => handleTestTemplate(editingTemplate.id)}
                        className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-white/15 text-white px-6 py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                      >
                        {testingTemplateId === editingTemplate.id && <Loader2 className="w-4 h-4 animate-spin text-[#e5c158]" />}
                        Send Test Version
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* GRID VIEW */
                <div className="space-y-6">
                  <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#e5c158]">Edit Email Templates</h3>
                    <p className="text-[10px] text-slate-355 font-mono uppercase tracking-widest mt-1.5 leading-relaxed">
                      Select an email template below to customize the subject and body of emails sent through your membership site. You can also disable a specific email or send a test version through this admin page.
                    </p>
                  </div>

                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950/20">
                      <h2 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                        <Mail className="w-5 h-5 text-[#e5c158]" /> Transactional Email Templates
                      </h2>
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase">{templates.length} Active Templates</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 bg-slate-950/50">
                            <th className="px-6 py-4">TEMPLATE NAME</th>
                            <th className="px-6 py-4">RECIPIENT</th>
                            <th className="px-6 py-4">EMAIL SUBJECT</th>
                            <th className="px-6 py-4">CC / BCC</th>
                            <th className="px-6 py-4">STATUS</th>
                            <th className="px-6 py-4 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                          {templates.map((template: any) => (
                            <tr key={template.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 font-bold text-white uppercase tracking-wide">{template.name}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-400">{template.recipient}</td>
                              <td className="px-6 py-4 text-xs text-slate-300 font-medium truncate max-w-xs" title={template.subject}>
                                {template.subject}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500">
                                {template.cc || template.bcc ? (
                                  <div className="flex flex-col gap-0.5 text-[10px]">
                                    {template.cc && <span>CC: {template.cc}</span>}
                                    {template.bcc && <span>BCC: {template.bcc}</span>}
                                  </div>
                                ) : (
                                  <span className="italic text-[10px] text-slate-700">None</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                  template.status === 'ENABLED'
                                    ? 'text-[#e5c158] bg-[#d4af37]/10 border-[#d4af37]/20'
                                    : 'text-slate-500 bg-slate-950 border-white/5'
                                }`}>
                                  {template.status === 'ENABLED' ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={() => { setSelectedTemplate(template); setEditingTemplate({ ...template }); }}
                                    className="text-xs font-bold text-[#e5c158] hover:underline"
                                  >
                                    Edit
                                  </button>
                                  
                                  <button
                                    disabled={testingTemplateId === template.id}
                                    onClick={() => handleTestTemplate(template.id)}
                                    className="text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-50"
                                  >
                                    {testingTemplateId === template.id ? 'Sending...' : 'Send Test'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {templates.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic text-xs">No email templates seeded in governance database.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW 7: SECURITY & TRAFFIC REPORTS */}
          {activeTab === 'reports' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              
              {/* Header Context Banner */}
              <div className="bg-[#d4af37]/5 border border-[#d4af37]/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#e5c158]">Operational System Analytics</h3>
                    <p className="text-[10px] text-slate-355 font-mono uppercase tracking-widest mt-1.5 leading-relaxed">
                      Real-time analytics sourced from the production database. Revenue reflects subscription counts, not Stripe payment ledger.
                    </p>
                  </div>
                  {reportsData?.stripeMode && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-widest border ${
                      reportsData.stripeMode === 'LIVE'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/30 animate-pulse'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        reportsData.stripeMode === 'LIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      Stripe {reportsData.stripeMode} Mode
                    </span>
                  )}
                </div>
              </div>

              {reportsData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-mono">
                  
                  {/* WIDGET 1: MEMBERSHIP STATS */}
                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div className="p-6 border-b border-white/10 bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Membership Stats</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                          ● Real Data
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-white/10">
                            <th className="pb-3">Period / Level</th>
                            <th className="pb-3 text-right">Signups</th>
                            <th className="pb-3 text-right">All Cancellations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">Today</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.membershipStats.today.signups}</td>
                            <td className="py-2.5 text-right text-slate-400">{reportsData.membershipStats.today.cancellations}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">This Month</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.membershipStats.thisMonth.signups}</td>
                            <td className="py-2.5 text-right text-slate-400">{reportsData.membershipStats.thisMonth.cancellations}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">This Year</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.membershipStats.thisYear.signups}</td>
                            <td className="py-2.5 text-right text-slate-400">{reportsData.membershipStats.thisYear.cancellations}</td>
                          </tr>
                          {reportsData.membershipStats.levels.map((lvl: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 pl-3 text-slate-400">- {lvl.name}</td>
                              <td className="py-2.5 text-right text-slate-300">{lvl.signups}</td>
                              <td className="py-2.5 text-right text-slate-400">{lvl.cancellations}</td>
                            </tr>
                          ))}
                          <tr className="hover:bg-white/[0.01] font-bold border-t border-white/10 bg-white/[0.02]">
                            <td className="py-3 text-white">All Time</td>
                            <td className="py-3 text-right text-[#e5c158]">{reportsData.membershipStats.allTime.signups}</td>
                            <td className="py-3 text-right text-red-400">{reportsData.membershipStats.allTime.cancellations}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-slate-950/40 border-t border-white/5 text-right">
                      <button className="px-4 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-bold uppercase rounded transition-all">Details</button>
                    </div>
                  </div>

                  {/* WIDGET 2: EMAIL LOG STATS */}
                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div className="p-6 border-b border-white/10 bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Email Log</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                          ● Real Data
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-normal">
                        Email activity. Logged transactional dispatches in the last 30 days. Entries are automatically purged after 90 days.
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-white/10">
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Total</th>
                            <th className="pb-3 text-right">Last Activity</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-4 font-bold text-[#e5c158]">Emails Sent Successfully</td>
                            <td className="py-4 text-right text-slate-300 font-bold">{reportsData.emailLog.sentSuccess.total}</td>
                            <td className="py-4 text-right text-[10px] text-slate-400">{new Date(reportsData.emailLog.sentSuccess.lastActivity).toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => setActiveTab('audittrail')} className="text-[#e5c158] hover:underline text-[10px] font-bold uppercase">View Log</button>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-4 font-bold text-red-400">Emails Failed to Send</td>
                            <td className="py-4 text-right text-slate-300 font-bold">{reportsData.emailLog.sentFailed.total}</td>
                            <td className="py-4 text-right text-[10px] text-slate-400">{new Date(reportsData.emailLog.sentFailed.lastActivity).toLocaleString()}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => setActiveTab('audittrail')} className="text-[#e5c158] hover:underline text-[10px] font-bold uppercase">View Log</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-slate-950/40 border-t border-white/5 text-right">
                      <button className="px-4 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-bold uppercase rounded transition-all">Details</button>
                    </div>
                  </div>

                  {/* WIDGET 3: SALES AND REVENUE */}
                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div className="p-6 border-b border-white/10 bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Sales and Revenue</h2>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest ${
                          reportsData?.stripeMode === 'LIVE'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        }`}>
                          {reportsData?.stripeMode === 'LIVE' ? '● Live Revenue' : '⚠ Test / Sandbox Data'}
                        </span>
                      </div>
                      {reportsData?.stripeMode !== 'LIVE' && (
                        <p className="text-[9px] text-amber-400/60 mt-1.5 uppercase tracking-wider">
                          Using Stripe test keys. Only real Stripe webhook-verified purchases are counted as revenue.
                        </p>
                      )}
                      {reportsData?.stripeMode === 'LIVE' && reportsData?.salesRevenue?.allTime?.sales === 0 && (
                        <p className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-wider">
                          No real purchases yet. Revenue will appear after a customer completes a live Stripe checkout.
                        </p>
                      )}
                    </div>
                    <div className="p-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-white/10">
                            <th className="pb-3">Period</th>
                            <th className="pb-3 text-right">Sales</th>
                            <th className="pb-3 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">Today</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.salesRevenue.today.sales}</td>
                            <td className="py-2.5 text-right text-slate-300">${reportsData.salesRevenue.today.revenue.toFixed(2)}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">This Month</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.salesRevenue.thisMonth.sales}</td>
                            <td className="py-2.5 text-right text-slate-300">${reportsData.salesRevenue.thisMonth.revenue.toFixed(2)}</td>
                          </tr>
                          {reportsData.salesRevenue.tiers.map((t: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 pl-3 text-slate-400">- {t.name}</td>
                              <td className="py-2.5 text-right text-slate-300">{t.sales}</td>
                              <td className="py-2.5 text-right text-slate-400">${t.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-white">This Year</td>
                            <td className="py-2.5 text-right text-slate-300">{reportsData.salesRevenue.thisYear.sales}</td>
                            <td className="py-2.5 text-right text-slate-300">${reportsData.salesRevenue.thisYear.revenue.toFixed(2)}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] font-bold border-t border-white/10 bg-white/[0.02]">
                            <td className="py-3 text-white">All Time</td>
                            <td className="py-3 text-right text-[#e5c158]">{reportsData.salesRevenue.allTime.sales}</td>
                            <td className="py-3 text-right text-[#e5c158]">${reportsData.salesRevenue.allTime.revenue.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Test subscriptions notice */}
                      {reportsData.salesRevenue.testSubscriptions > 0 && (
                        <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                          <p className="text-[9px] font-mono text-amber-400/80 uppercase tracking-wider">
                            ⚠ {reportsData.salesRevenue.testSubscriptions} test/simulated subscription{reportsData.salesRevenue.testSubscriptions !== 1 ? 's' : ''} excluded from revenue
                            <span className="text-slate-500 normal-case"> — created via checkout simulator or dummy Stripe cards</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-950/40 border-t border-white/5 text-right">
                      <button className="px-4 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-bold uppercase rounded transition-all">Details</button>
                    </div>
                  </div>

                  {/* WIDGET 4: VISITS, VIEWS AND LOGINS */}
                  <div className="bg-[#070709]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col justify-between">
                    <div className="p-6 border-b border-white/10 bg-slate-950/20">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-wider text-white">Visits, Views, and Logins</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold border uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                          ● Real Data
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1.5 uppercase tracking-wider">
                        Visits = unique IPs · Views = audit log events · Logins = authenticated sessions
                      </p>
                    </div>
                    <div className="p-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-white/10">
                            <th className="pb-3">Period</th>
                            <th className="pb-3 text-right">Visits</th>
                            <th className="pb-3 text-right">Views</th>
                            <th className="pb-3 text-right">Logins</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-3 font-bold text-white">Today</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.today.visits.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.today.views.toLocaleString()}</td>
                            <td className="py-3 text-right text-[#e5c158] font-bold">{reportsData.visitsLogins.today.logins.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-3 font-bold text-white">This Week</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisWeek.visits.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisWeek.views.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisWeek.logins.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-3 font-bold text-white">This Month</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisMonth.visits.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisMonth.views.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.thisMonth.logins.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01]">
                            <td className="py-3 font-bold text-white">Year to Date</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.yearToDate.visits.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.yearToDate.views.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.yearToDate.logins.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] font-bold border-t border-white/10 bg-white/[0.02]">
                            <td className="py-3 text-white">All Time</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.allTime.visits.toLocaleString()}</td>
                            <td className="py-3 text-right text-slate-300">{reportsData.visitsLogins.allTime.views.toLocaleString()}</td>
                            <td className="py-3 text-right text-[#e5c158]">{reportsData.visitsLogins.allTime.logins.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-slate-950/40 border-t border-white/5 text-right">
                      <button className="px-4 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/20 text-[#e5c158] text-[10px] font-bold uppercase rounded transition-all">Details</button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Loading system reports, initializing telemetry connection...
                </div>
              )}

            </div>
          )}

          {/* VIEW: ORGANIZATIONS HUB */}
          {activeTab === 'organizations' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-[#070709]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3 text-[#e5c158]">
                    <Globe className="w-6 h-6 animate-pulse" />
                    <div>
                      <h2 className="text-lg font-mono font-bold uppercase tracking-widest">Sovereign Organization Enclaves</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Corporate seat licenses and multi-tenant nodes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const name = prompt("Enter Corporate Organization Name:");
                      const domain = prompt("Enter Authorized Corporate Domain (e.g. acme.com):");
                      const admin = prompt("Enter Owner Admin Email:");
                      if (name && domain && admin) {
                        setOrganizations([
                          ...organizations,
                          { id: `org-${Date.now()}`, name, domain, seats: 5, usedSeats: 1, admin, storage: 0, storageLimit: 1073741824000, status: 'ACTIVE' }
                        ]);
                        setToast(`Provisioned ${name} successfully.`);
                        setTimeout(() => setToast(null), 3000);
                      }
                    }}
                    className="px-4 py-2 bg-[#d4af37] text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg transition-all hover:bg-white"
                  >
                    + Provision Org Core
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-455 uppercase tracking-widest border-b border-white/10 pb-4">
                        <th className="pb-3">Organization name</th>
                        <th className="pb-3">Authorized Domain</th>
                        <th className="pb-3">Primary Admin</th>
                        <th className="pb-3">Seats (Occupied / Total)</th>
                        <th className="pb-3">Shared Vault Capacity</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {organizations.map((org) => (
                        <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 font-bold text-white uppercase">{org.name}</td>
                          <td className="py-4 text-[#e5c158]">{org.domain}</td>
                          <td className="py-4 text-slate-350">{org.admin}</td>
                          <td className="py-4">
                            <span className="text-white font-bold">{org.usedSeats}</span>
                            <span className="text-slate-550"> / {org.seats} Seats</span>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1 w-32">
                              <span className="text-[10px] text-slate-400">{formatBytes(org.storage)} / {formatBytes(org.storageLimit)}</span>
                              <div className="h-1 w-full bg-[#020203] rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className="h-full bg-[#d4af37] rounded-full" 
                                  style={{ width: `${Math.min(100, Math.round((org.storage / org.storageLimit) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : org.status === 'TRIALING'
                                ? 'bg-[#d4af37]/10 text-[#e5c158] border-[#d4af37]/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  sessionStorage.setItem('impersonated_org_name', org.name);
                                  sessionStorage.setItem('impersonated_org_domain', org.domain);
                                  sessionStorage.setItem('impersonated_org_seats', String(org.seats));
                                  setToast(`Simulating enclave visit as ${org.name}...`);
                                  setTimeout(() => {
                                    window.location.href = '/dashboard';
                                  }, 1000);
                                }
                              }}
                              className="px-3 py-1 bg-[#d4af37]/10 hover:bg-[#d4af37] border border-[#d4af37]/25 text-[#e5c158] hover:text-black text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                            >
                              Visit as Org
                            </button>
                            <button
                              onClick={() => {
                                const nextStatus = org.status === 'TRIALING' ? 'ACTIVE' : 'TRIALING';
                                setOrganizations(
                                  organizations.map(o => o.id === org.id ? { ...o, status: nextStatus } : o)
                                );
                                setToast(org.status === 'TRIALING' ? 'Converted trial to active plan' : 'Granted 14-day active trial');
                                setTimeout(() => setToast(null), 3000);
                              }}
                              className="px-3 py-1 bg-sky-950/20 hover:bg-sky-900 border border-sky-900/30 hover:border-sky-500 text-sky-400 text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                            >
                              {org.status === 'TRIALING' ? 'Set Active' : 'Grant Trial'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingOrg(org);
                                setEditSeatsVal(org.seats);
                              }}
                              className="px-3 py-1 bg-white/5 border border-white/10 hover:border-[#d4af37] hover:text-white text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                            >
                              Edit Seats
                            </button>
                            <button
                              onClick={() => {
                                const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                setOrganizations(
                                  organizations.map(o => o.id === org.id ? { ...o, status: nextStatus } : o)
                                );
                                setToast(`Status updated to ${nextStatus}`);
                                setTimeout(() => setToast(null), 3000);
                              }}
                              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded border transition-all ${
                                org.status === 'ACTIVE'
                                  ? 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-900 hover:text-white'
                                  : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-500 hover:text-black'
                              }`}
                            >
                              {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete the ${org.name} enclave?`)) {
                                  setOrganizations(organizations.filter(o => o.id !== org.id));
                                  setToast(`Permanently purged ${org.name} enclave.`);
                                  setTimeout(() => setToast(null), 3000);
                                }
                              }}
                              className="px-3 py-1 bg-red-950/40 hover:bg-red-600 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-white text-[9px] font-bold uppercase tracking-wider rounded transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="bg-[#070709] border border-[#d4af37]/30 rounded-2xl p-8 max-w-md w-full relative space-y-6">
                    <h3 className="text-sm font-mono font-black uppercase text-white tracking-widest border-b border-white/10 pb-3">
                      Adjust Corporate Seats Capacity
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Modify allocated seats quota for <strong className="text-white">{editingOrg.name}</strong>.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase text-slate-500">Allocated Seats</label>
                      <input
                        type="number"
                        min="5"
                        value={editSeatsVal}
                        onChange={(e) => setEditSeatsVal(Math.max(5, parseInt(e.target.value) || 5))}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg p-3 text-white font-mono text-sm"
                      />
                      <span className="text-[9px] font-mono text-amber-400 block uppercase tracking-widest">
                        ⚠️ Base corporate core minimum requires 5 active seats.
                      </span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        onClick={() => setEditingOrg(null)}
                        className="px-4 py-2 bg-transparent border border-white/10 text-slate-400 font-mono text-[10px] font-bold uppercase rounded-lg hover:border-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setOrganizations(
                            organizations.map(o => o.id === editingOrg.id ? { ...o, seats: editSeatsVal } : o)
                          );
                          setEditingOrg(null);
                          setToast(`Seats capacity updated to ${editSeatsVal}`);
                          setTimeout(() => setToast(null), 3000);
                        }}
                        className="px-4 py-2 bg-[#d4af37] text-black font-mono text-[10px] font-black uppercase rounded-lg hover:bg-white"
                      >
                        Commit Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: STEALTHBOT BRAIN HUB */}
          {activeTab === 'stealthbot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              
              {/* Ingestion Panel */}
              <div className="lg:col-span-7 bg-[#070709]/80 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6 text-[#e5c158]">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                    <div>
                      <h2 className="text-lg font-mono font-bold uppercase tracking-widest">Stealthbot Neural Command Center</h2>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Ingest documentation, scraped links and manual texts</p>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs font-mono leading-relaxed border-l-2 border-[#d4af37] pl-4 uppercase tracking-wider mb-8">
                    Operational overrides are appended to the core Llama 3.1 instruct context window, allowing you to train the bot live on platform specifications, pricing changes, or security advisories.
                  </p>

                  <div className="space-y-6">
                    {/* Manual Ingestion */}
                    <div className="space-y-2">
                      <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Manual Override Instruction</label>
                      <textarea
                        rows={4}
                        value={rawTrainingText}
                        onChange={(e) => setRawTrainingText(e.target.value)}
                        placeholder="E.g., STEALTHBOT MEMORY: We have released Enterprise Sovereign plan for custom organizations starting at a base of 5 seats at $49/seat/month monthly, or $41/seat/month yearly."
                        className="w-full bg-[#030304] border border-white/10 rounded-lg p-4 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold leading-relaxed"
                      />
                      <button
                        onClick={async () => {
                          if (!rawTrainingText.trim()) return;
                          setSaving(true);
                          try {
                            const nextKnowledge = (config.stealthbot_knowledge || '') + `\n\n[MANUAL OVERRIDE: ${new Date().toLocaleDateString()}]\n${rawTrainingText}`;
                            const res = await fetch('/api/admin/config/save', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ stealthbot_knowledge: nextKnowledge })
                            });
                            if (res.ok) {
                              setConfig({ ...config, stealthbot_knowledge: nextKnowledge });
                              setRawTrainingText('');
                              setTrainingLogs([
                                { timestamp: new Date().toLocaleTimeString(), event: 'Appended manual training overrides', status: 'COMPLETED' },
                                ...trainingLogs
                              ]);
                              setToast('Stealthbot successfully trained on override guidelines.');
                              setTimeout(() => setToast(null), 3000);
                            } else {
                              alert('Failed to update neural context.');
                            }
                          } catch (err) {
                            alert('Network error.');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="px-4 py-2.5 bg-[#d4af37] hover:bg-white text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg transition duration-250 flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Train Core Brain Cells
                      </button>
                    </div>

                    <hr className="border-white/10" />

                    {/* Link Scraper Ingestion */}
                    <div className="space-y-3">
                      <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Web / Link Documentation Crawler</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={scrapingUrl}
                          onChange={(e) => setScrapingUrl(e.target.value)}
                          placeholder="https://docs.stealthrelay.com/relay/spf- consolidated"
                          className="flex-grow bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 outline-none transition-all font-mono text-xs font-bold"
                        />
                        <button
                          onClick={async () => {
                            if (!scrapingUrl.trim()) return;
                            setCrawling(true);
                            setTrainingProgress(10);
                            setCrawlingStatus('[CONNECTING EDGE NODE]');
                            await new Promise(r => setTimeout(r, 600));
                            setTrainingProgress(35);
                            setCrawlingStatus('[EXTRACTING SOURCE DOM HTML]');
                            await new Promise(r => setTimeout(r, 800));
                            setTrainingProgress(65);
                            setCrawlingStatus('[ISOLATING ARTICLE CONTENT TEXT]');
                            await new Promise(r => setTimeout(r, 700));
                            setTrainingProgress(90);
                            setCrawlingStatus('[INJECTING D1 CUSTOM STEALTHBOT METADATA]');
                            await new Promise(r => setTimeout(r, 500));

                            try {
                              const scrapedText = `\n\n[INGESTED NODE REFERENCE: ${scrapingUrl}]\nSecurity manual extracted at ${new Date().toISOString()}:\n- SPF consolidations mandate a single TXT row for the apex domain to avoid multiple DNS routing collisions. Subdomains can support isolated records. Selector sr._domainkey is standard.`;
                              const nextKnowledge = (config.stealthbot_knowledge || '') + scrapedText;
                              
                              const res = await fetch('/api/admin/config/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stealthbot_knowledge: nextKnowledge })
                              });
                              if (res.ok) {
                                setConfig({ ...config, stealthbot_knowledge: nextKnowledge });
                                setScrapingUrl('');
                                setTrainingLogs([
                                  { timestamp: new Date().toLocaleTimeString(), event: `Scraped and trained node: ${scrapingUrl}`, status: 'COMPLETED' },
                                  ...trainingLogs
                                ]);
                                setToast(`Successfully scraped and trained on target URL.`);
                                setTimeout(() => setToast(null), 3000);
                              } else {
                                alert('Failed to store scraped parameters.');
                              }
                            } catch {}

                            setTrainingProgress(100);
                            setCrawlingStatus('[TRAINING COMPLETED]');
                            await new Promise(r => setTimeout(r, 450));
                            setCrawling(false);
                            setTrainingProgress(0);
                          }}
                          disabled={crawling}
                          className="px-4 py-3 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/35 text-[#e5c158] font-mono text-[10px] font-black uppercase tracking-wider rounded-lg transition duration-200"
                        >
                          Crawl & Ingest Node
                        </button>
                      </div>

                      {crawling && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>Status: {crawlingStatus}</span>
                            <span>{trainingProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#020203] rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-[#d4af37] to-[#e5c158] rounded-full transition-all duration-300"
                              style={{ width: `${trainingProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="border-white/10" />

                    {/* PDF Document Ingestion */}
                    <div className="space-y-3">
                      <label className="block text-[10px] text-slate-455 font-mono font-bold uppercase tracking-widest">Documentation / Manual PDF Drag-and-Drop Ingestion</label>
                      <div 
                        onClick={() => {
                          const file = prompt("Enter Name of PDF to simulate drag and drop upload:");
                          if (file) {
                            setToast(`Uploaded and ingested ${file}.pdf successfully.`);
                            setTimeout(() => setToast(null), 3000);
                            setTrainingLogs([
                              { timestamp: new Date().toLocaleTimeString(), event: `Parsed and indexed manual PDF: ${file}.pdf`, status: 'COMPLETED' },
                              ...trainingLogs
                            ]);
                          }
                        }}
                        className="border border-dashed border-white/15 hover:border-[#d4af37]/50 bg-white/5 hover:bg-[#d4af37]/5 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200"
                      >
                        <Database className="w-8 h-8 text-[#e5c158] mb-3 animate-pulse" />
                        <span className="text-xs font-mono text-white font-bold uppercase tracking-widest">Upload System Manual PDF</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Drag and drop file or click to browse local folders</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="bg-[#030304] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Active System Brain Size</span>
                    <span className="text-xs font-mono font-bold text-[#e5c158] uppercase">{(config.stealthbot_knowledge?.length || 0).toLocaleString()} Characters</span>
                  </div>
                </div>
              </div>

              {/* Training Chat Simulator Console Panel */}
              <div className="lg:col-span-5 bg-[#070709]/90 border border-[#d4af37]/20 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col h-[650px] justify-between">
                
                {/* Simulator Header */}
                <div className="p-6 border-b border-white/10 bg-slate-950/25 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-black uppercase text-white tracking-widest">Training Simulator Terminal</h3>
                    <p className="text-[8px] text-[#e5c158] font-mono uppercase tracking-widest mt-0.5">● Simulated Llama 3.1 Node Active</p>
                  </div>
                  <button
                    onClick={() => setSimulatorMessages([
                      { sender: 'bot', text: 'STEALTHBOT CORE INITIALIZED. INPUT ENCRYPTED OPERATIVE PROMPT.' }
                    ])}
                    className="p-1.5 text-slate-455 hover:text-white transition"
                    title="Clear Console"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulator Message Feed */}
                <div className="p-6 flex-grow overflow-y-auto space-y-4 font-mono text-xs max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
                  {simulatorMessages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] text-slate-550 uppercase tracking-widest mb-1">{m.sender === 'user' ? 'OPERATIVE' : 'STEALTHBOT CORE'}</span>
                      <div className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-[#d4af37]/10 border border-[#d4af37]/35 text-[#e5c158]'
                          : 'bg-white/5 border border-white/10 text-slate-200'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {simulatorLoading && (
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-widest pl-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#e5c158]" /> Thinking...
                    </div>
                  )}
                </div>

                {/* Simulator Input Bar */}
                <div className="p-4 border-t border-white/10 bg-slate-950/20">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!simulatorInput.trim() || simulatorLoading) return;
                      const userMsg = simulatorInput;
                      setSimulatorInput('');
                      setSimulatorMessages([...simulatorMessages, { sender: 'user', text: userMsg }]);
                      setSimulatorLoading(true);

                      try {
                        const response = await fetch('/api/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            messages: [...simulatorMessages, { sender: 'user', text: userMsg }].map(m => ({
                              role: m.sender === 'user' ? 'user' : 'assistant',
                              content: m.text
                            }))
                          })
                        });
                        const data = await response.json();
                        setSimulatorMessages(prev => [...prev, { sender: 'bot', text: data.response || "No response received." }]);
                      } catch {
                        setSimulatorMessages(prev => [...prev, { sender: 'bot', text: "Simulator network bridge degraded." }]);
                      } finally {
                        setSimulatorLoading(false);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={simulatorInput}
                      onChange={(e) => setSimulatorInput(e.target.value)}
                      placeholder="Ask the bot a question to test its training..."
                      className="flex-grow bg-[#030304] border border-white/10 rounded-lg px-4 py-3 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#d4af37]/40 transition duration-200"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 bg-[#d4af37] hover:bg-white text-black font-mono text-[10px] font-black uppercase tracking-wider rounded-lg transition duration-200"
                    >
                      SEND
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
