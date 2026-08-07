'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Inbox, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  LogOut, 
  User as UserIcon,
  Shield,
  Layers
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Feedback Inbox', href: '/inbox', icon: Inbox },
    { name: 'Theme Trends', href: '/trends', icon: TrendingUp },
    { name: 'Ask LOOP', href: '/ask', icon: MessageSquare },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-violet-500/10 text-violet-400 border border-violet-500/25';
      case 'ANALYST': return 'bg-teal-500/10 text-teal-400 border border-teal-500/25';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Branding */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-display font-bold text-white text-lg shadow-md shadow-primary/20">
            L
          </div>
          <div>
            <span className="font-display font-bold text-xl bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">
              LOOP
            </span>
            <span className="text-[10px] block font-mono text-text-muted -mt-1 font-semibold uppercase tracking-wider">
              Feedback Intel
            </span>
          </div>
        </Link>
      </div>

      {/* Workspace Display */}
      <div className="px-6 py-4 border-b border-border bg-[#1A2232]/30">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <div className="overflow-hidden">
            <span className="text-xs text-text-secondary block font-medium uppercase tracking-wider">Workspace</span>
            <span className="text-sm font-semibold text-text-primary block truncate">
              {session?.user?.workspaceId ? 'Acme Corp' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'text-text-secondary hover:text-text-primary hover:bg-[#1E2638]'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-primary-light'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-border bg-[#121722]/60">
        {session?.user && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1E2638] border border-border flex items-center justify-center text-primary-light">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-primary block truncate">
                  {session.user.name}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${getRoleBadgeClass(session.user.role)}`}>
                  <Shield className="w-2.5 h-2.5" />
                  {session.user.role}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
