'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const navItems = [
  { href: '/owner-dashboard', label: 'Dashboard', shortLabel: 'Home' },
  { href: '/owner-dashboard/cars', label: 'Cars', shortLabel: 'Cars' },
  { href: '/owner-dashboard/employees', label: 'Employees', shortLabel: 'Team' },
  { href: '/owner-dashboard/attendance', label: 'Attendance', shortLabel: 'Attend' },
  { href: '/owner-dashboard/customers', label: 'Customers', shortLabel: 'Cust.' },
  { href: '/owner-dashboard/reports', label: 'Reports', shortLabel: 'Reports' },
];

type OwnerDashboardLayoutProps = {
  children: ReactNode;
};

export default function OwnerDashboardLayout({ children }: OwnerDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('Account');

  useEffect(() => {
    async function loadUser() {
      const response = await supabase.auth.getUser();
      const user = response.data.user;
      setUserEmail(user?.email ?? 'Account');

      if (!user?.id) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
      const role = (data as { role?: string } | null)?.role;

      if (error || role !== 'owner') {
        router.replace('/employee-dashboard');
      }
    }

    void loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      setUserEmail(currentUser?.email ?? 'Account');

      if (!currentUser?.id) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase.from('users').select('role').eq('id', currentUser.id).single();
      const role = (data as { role?: string } | null)?.role;

      if (error || role !== 'owner') {
        router.replace('/employee-dashboard');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-sm lg:flex">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">The Xchangers</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Owner Workspace</h2>
            <p className="mt-2 text-sm text-slate-500">A clean command center for daily operations.</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/owner-dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {item.shortLabel.slice(0, 2).toUpperCase()}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-4 text-white">
            <p className="text-sm font-semibold">Keep everything moving</p>
            <p className="mt-1 text-sm text-indigo-50">Monitor cars, teams, attendance, and customer activity in one place.</p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Owner Portal</p>
                <p className="text-sm text-slate-600">{userEmail}</p>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>

      <nav className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/owner-dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                }`}
              >
                <span className="text-sm">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
