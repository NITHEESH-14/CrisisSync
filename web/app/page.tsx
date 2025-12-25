'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { EmergencyActions } from '@/components/EmergencyActions';
import { SettingsMenu } from '@/components/SettingsMenu';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user_profile');
    if (!user) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-20 bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 font-[family-name:var(--font-sans)]">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl w-full">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Crisis<span className="text-emergency">Sync</span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400">
            Unified Real-Time Emergency Response Platform
          </p>
        </div>

        <div className="w-full p-8 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Is this an emergency?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              Get immediate help and guidance.
            </p>
          </div>

          <EmergencyActions />

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Link href="/helplines" className="block">
            <div className="p-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-safety transition-colors flex flex-col items-center justify-center h-full">
              <span className="block mb-2 text-safety dark:text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Help Lines</span>
            </div>
          </Link>
          <Link href="/dashboard" className="block">
            <div className="p-4 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-alert transition-colors flex flex-col items-center justify-center h-full">
              <span className="block mb-2 text-alert dark:text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Live Emergencies</span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-neutral-400 text-sm">
        <p>© 2025 CrisisSync. Enhancing Public Safety.</p>
      </footer>

      <SettingsMenu />
    </div>
  );
}
