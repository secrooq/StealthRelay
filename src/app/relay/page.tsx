import { RelayDashboard } from '@/components/RelayDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StealthRelay - Dynamic Email Masking',
  description: 'Generate armored email aliases on the edge.'
};

export default function RelayPage() {
  return (
    <div className="min-h-screen w-full">
      <RelayDashboard />
    </div>
  );
}
