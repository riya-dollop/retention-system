import './globals.css';
import Link from 'next/link';
import { MessageSquare, ShieldCheck, FileCode2 } from 'lucide-react';

export const metadata = {
  title: 'Wholesale Retention & Payment Follow-up System',
  description: 'Stage-based automated collections, retention offers, churn prevention and staff escalation system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
        {/* Universal Top Header */}
        <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-3 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
                ₹
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <span>KrediFlow</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-medium">
                    Wholesale Retention
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400">Payment Follow-up & Staff Escalation System</p>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Mock Chat</span>
              </Link>

              <Link
                href="/staff"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Staff & Escalations</span>
              </Link>

              <a
                href="http://localhost:4000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition"
                title="Open Interactive Swagger OpenAPI Documentation & Test Playground"
              >
                <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Swagger Docs</span>
              </a>
            </nav>
          </div>
        </header>

        {/* Main Application Body */}
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}

