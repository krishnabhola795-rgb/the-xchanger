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
    // Check if intro has been shown in this session
    const introShown = sessionStorage.getItem('introVideoShown');
    if (introShown === 'true') {
      setShowIntro(false);
    }
  }, []);

  const handleIntroComplete = () => {
    // Mark intro as shown for this session
    sessionStorage.setItem('introVideoShown', 'true');
    // Fade out the intro video
    setShowIntro(false);
  };

  // Don't render anything until we're on the client to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <>
      {showIntro && <IntroVideo onComplete={handleIntroComplete} />}
      <main className={`min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 transition-opacity duration-500 ${
        showIntro ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:gap-14">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-sm sm:p-12">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image src="/logo.png" alt="The Xchangers logo" width={72} height={72} className="object-contain" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">The Xchangers</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Welcome back. Who are you?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Select the role that matches your account and continue to the appropriate login flow.
            Owners can manage listings, customers, and reports; employees can access tasks, attendance, and support tools.
          </p>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            href="/login?role=owner"
            className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/10">
              <span className="text-3xl font-black">O</span>
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-slate-950">I'm an Owner</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Manage inventory, customers, cars, reports, and owner-specific workflows.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-700">
              Continue as owner →
            </div>
          </Link>

          <Link
            href="/login?role=employee"
            className="group rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-100 text-indigo-800 shadow-lg shadow-indigo-500/10">
              <span className="text-3xl font-black">E</span>
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-slate-950">I'm an Employee</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in to manage attendance, customer interactions, follow-ups, and employee workflows.
              </p>
            </div>
            <div className="mt-6 text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-700">
              Continue as employee →
            </div>
          </Link>
        </div>
      </div>
    </main>
    </>
  );
}
