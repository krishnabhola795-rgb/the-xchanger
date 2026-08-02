export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Workspace summary</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Employee Dashboard</h2>
        <p className="mt-2 text-sm text-slate-500">Everything you need to manage leads and follow-ups.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Today’s focus</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Customer conversations</h2>
          <p className="mt-2 text-sm text-slate-500">Open the customers and follow-up views to keep your pipeline moving.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-500">Quick actions</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a href="/employee-dashboard/customers" className="rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700">Add customer</a>
            <a href="/employee-dashboard/attendance" className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Check attendance</a>
          </div>
        </section>
      </div>
    </div>
  );
}
