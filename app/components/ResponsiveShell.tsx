'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ownerLinks = [
  { href: '/owner-dashboard', label: 'Overview' },
  { href: '/owner-dashboard/cars', label: 'Cars' },
];

const employeeLinks = [
  { href: '/employee-dashboard', label: 'Overview' },
  { href: '/employee-dashboard/attendance', label: 'Attendance' },
  { href: '/employee-dashboard/customers', label: 'Customers' },
  { href: '/employee-dashboard/followups', label: 'Follow-ups' },
  { href: '/employee-dashboard/search', label: 'Search Cars' },
];

type ResponsiveShellProps = {
  role: 'owner' | 'employee';
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function ResponsiveShell({ role, title, subtitle, children }: ResponsiveShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === 'owner' ? ownerLinks : employeeLinks;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">The Xchangers</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">CRM Workspace</h2>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center rounded-lg px-3 py-3 text-sm font-medium transition ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Stay organized</p>
            <p className="mt-1 text-sm text-slate-600">A focused workspace for tracking cars, customers, and follow-ups.</p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen((current) => !current)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
                  aria-label="Toggle navigation"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M3 5h14v1.5H3zM3 9.25h14v1.5H3zM3 13.5h14V15H3z" />
                  </svg>
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{role === 'owner' ? 'Owner Portal' : 'Employee Portal'}</p>
                  <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
                  {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
                </div>
              </div>

              <button
                onClick={() => void handleLogout()}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>

            {mobileOpen ? (
              <nav className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 lg:hidden">
                {links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-lg px-3 py-3 text-sm font-medium ${
                        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </header>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
