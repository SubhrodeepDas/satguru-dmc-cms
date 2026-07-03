import Link from 'next/link';
import { collectionGroups } from '../../lib/collections';
import { readAll } from '../../lib/db';
import { GroupIcon } from '../../components/Icons';

// Read live counts on every request (not baked in at build time), so the
// dashboard reflects the current data on Vercel.
export const dynamic = 'force-dynamic';

const BADGE_TINTS = [
  { bg: '#EFEDFC', fg: '#6C5CE7' },
  { bg: '#FCE9F3', fg: '#E84393' },
  { bg: '#E8F0FE', fg: '#3B82F6' },
  { bg: '#FEF3E2', fg: '#F59E0B' },
  { bg: '#E7F9F0', fg: '#10B981' },
];

export default async function AdminDashboard() {
  const allItems = Object.values(collectionGroups).flat();
  const counts = {};
  await Promise.all(
    allItems.map(async (item) => {
      counts[item.slug] = (await readAll(item.slug)).length;
    })
  );
  const totalItems = allItems.reduce((sum, item) => sum + counts[item.slug], 0);

  return (
    <div>
      <div className="relative overflow-hidden bg-brand rounded-3xl px-8 py-9 mb-9">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-24 w-24 h-24 rounded-full bg-white/10" />
        <p className="relative text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-2">Content Admin</p>
        <h1 className="relative text-[26px] sm:text-3xl font-bold text-white mb-2 max-w-lg leading-tight">
          Welcome back — {totalItems} items ready to manage
        </h1>
        <p className="relative text-sm text-white/75 max-w-md">
          Everything you save here writes straight to the site's data and goes live immediately — no rebuild, no waiting.
        </p>
      </div>

      {Object.entries(collectionGroups).map(([group, items]) => (
        <div key={group} className="mb-9">
          <div className="flex items-center gap-2 mb-3.5">
            <span className="w-6 h-6 rounded-md bg-brand-tint text-brand flex items-center justify-center">
              <GroupIcon group={group} className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{group}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
              const count = counts[item.slug];
              const tint = BADGE_TINTS[i % BADGE_TINTS.length];
              return (
                <Link
                  key={item.slug}
                  href={`/admin/${item.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-soft p-5 hover:shadow-card hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tint.bg, color: tint.fg }}
                    >
                      <GroupIcon group={group} className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-semibold text-brand bg-brand-tint rounded-full px-2.5 py-1">
                      {count}
                    </span>
                  </div>
                  <div className="font-semibold text-brand-dark group-hover:text-brand transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{count} item{count === 1 ? '' : 's'} · manage →</div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
