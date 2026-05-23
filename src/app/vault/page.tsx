'use client';

import { useEffect, useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { VaultProvider, useVault } from '../../components/VaultProvider';
import VaultSetup from '../../components/VaultSetup';
import VaultLock from '../../components/VaultLock';
import VaultDashboard from '../../components/VaultDashboard';

function VaultController() {
  const { vaultKey } = useVault();
  const [profileState, setProfileState] = useState<{ exists: boolean, profile?: any, loading: boolean }>({
    exists: false,
    loading: true
  });

  const checkProfile = async () => {
    setProfileState(s => ({ ...s, loading: true }));
    try {
      const res = await fetch('/api/vault/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileState({
          exists: data.exists,
          profile: data.profile,
          loading: false
        });
      }
    } catch (e) {
      setProfileState(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    checkProfile();
  }, []);

  if (profileState.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase font-mono">Initializing Cryptomodule...</p>
      </div>
    );
  }

  // Case 1: New user, must setup
  if (!profileState.exists) {
    return <VaultSetup onComplete={checkProfile} />;
  }

  // Case 2: Profile exists, but we haven't unlocked the key locally in this session
  if (!vaultKey) {
    return <VaultLock profile={profileState.profile} />;
  }

  // Case 3: Key derived, user authenticated, show vault content
  return <VaultDashboard />;
}

export default function VaultPage() {
  return (
    <VaultProvider>
      <main className="min-h-screen bg-slate-950 px-4 py-12 md:py-20 text-slate-100 overflow-hidden relative">
        
        <div className="relative z-10 container mx-auto">
          <VaultController />
        </div>
      </main>
    </VaultProvider>
  );
}
