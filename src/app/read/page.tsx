'use client';

import SecretReader from '@/components/SecretReader';
import { Shield } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SecretReaderContainer() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  
  return <SecretReader id={id} />;
}

export default function ReadSecretPage() {
  return (
    <div className="flex flex-col items-center min-h-[80vh] py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-gray-900 border border-gray-800 rounded-2xl mb-6 shadow-lg">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">
          StealthSecret
        </h1>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center text-white text-sm font-mono">
          Initializing Reader Engine...
        </div>
      }>
        <SecretReaderContainer />
      </Suspense>
    </div>
  );
}
