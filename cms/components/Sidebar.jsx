'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { collectionGroups } from '../lib/collections';
import { IconGrid, GroupIcon } from './Icons';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    setDark(isDark);
    try {
      localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
    } catch {}
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-white h-full flex flex-col border-r border-gray-100">
      <div className="px-6 py-6 border-b border-gray-100">
        <img
          src="/satguru-logo.gif"
          alt="Satguru Travel"
          className="admin-logo w-24 h-auto select-none"
        />
        <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
          Content Admin
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
          Overview
        </div>
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-colors ${
            pathname === '/admin' ? 'bg-[#1a7c45] text-white font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
          }`}
        >
          <IconGrid className="w-[18px] h-[18px] shrink-0" />
          Dashboard
        </Link>

        {Object.entries(collectionGroups).map(([group, items]) => (
          <div key={group} className="mt-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
              {group}
            </div>
            {items.map((item) => {
              const href = `/admin/${item.slug}`;
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={item.slug}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] mb-1 transition-colors ${
                    active ? 'bg-[#1a7c45] text-white font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
                  }`}
                >
                  <GroupIcon group={group} className="w-[18px] h-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] text-gray-500 hover:bg-gray-50 hover:text-brand-dark transition-colors"
        >
          {dark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
