'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { collectionGroups } from '../lib/collections';
import { IconGrid, GroupIcon } from './Icons';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-white h-full flex flex-col border-r border-gray-100">
      <div className="px-6 py-7 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center font-bold text-sm text-white shrink-0">
          S
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight text-brand-dark truncate">Satguru DMC</div>
          <div className="text-[11px] text-gray-400 leading-tight">Content Admin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
          Overview
        </div>
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-1 transition-colors ${
            pathname === '/admin' ? 'bg-brand-tint text-brand font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
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
                    active ? 'bg-brand-tint text-brand font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
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

      <div className="p-4 border-t border-gray-100">
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
