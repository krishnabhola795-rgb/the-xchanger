'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import IntroVideo from './components/IntroVideo';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const introShown = sessionStorage.getItem('introVideoShown');
    if (introShown === 'true') {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('introVideoShown', 'true');
    setShowIntro(false);
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
      <main className={`min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 transition-opacity duration-500 ${
        showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="mx-auto flex max-w-4xl flex-col gap-10 sm:gap-14">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm sm:p-12">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <Image src="/logo.png" alt="The Xchangers logo" width={72} height={72} className="object-contain" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">The Xchangers</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Welcome back.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Sign in to continue to your workspace. Owners and employees use the same login form and are routed to the correct dashboard after authentication.
            </p>
          </section>

          <Link
            href="/login"
            className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/10">
              <span className="text-3xl font-black">→</span>
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-slate-950">Continue to login</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use your existing Supabase credentials to sign in and access the correct dashboard.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-700">
              Go to login →
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}
