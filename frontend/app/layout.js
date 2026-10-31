import './globals.css';
import Link from 'next/link';
import { MessageSquare, ShieldCheck, FileCode2, Sparkles, Activity } from 'lucide-react';

export const metadata = {
  title: 'KrediFlow | Wholesale Retention & Collections Engine',
  description: 'Stage-based automated collections, retention offers, churn prevention and staff escalation system.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {/* Universal Top Header */}
        <header className="bg-slate-950 text-white border-b border-slate-800/80 px-4 md:px-6 py-2.5 sticky top-0 z-40 shadow-md backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40 text-base ring-1 ring-emerald-400/30">
                ₹
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                    <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">KrediFlow</span>
                  </h1>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" /> Live Engine
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Wholesale Collections & Retention System</p>
              </div>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700 active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Mock Chat</span>
              </Link>

              <Link
                href="/staff"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700 active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Staff & Escalations</span>
              </Link>

              <a
                href="http://localhost:4000/api-docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/40 transition-all active:scale-95 shadow-sm"
                title="Open Interactive Swagger OpenAPI Documentation & Test Playground"
              >
                <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Swagger API</span>
              </a>
            </nav>
          </div>
        </header>

        {/* Main Application Body */}
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </body>
    </html>
  );
}
