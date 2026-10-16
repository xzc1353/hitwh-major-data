import { NavLink, Link } from 'react-router-dom';
import { SITE } from '@/config/site';

const NAV = [
  { to: '/', label: '首页', end: true },
  { to: '/clusters', label: '招生大类' },
  { to: '/compare', label: '数据对比' },
  { to: '/about', label: '关于本站' },
];

export default function Header() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 no-underline">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-hit-700 text-sm font-bold text-white">
            HW
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight text-slate-900">
              {SITE.name}
            </span>
            <span className="block truncate text-[11px] leading-tight text-slate-400">
              {SITE.tagline} · 数据截止 {SITE.dataUpdatedAt}
            </span>
          </span>
        </Link>

        <nav aria-label="主导航" className="flex items-center gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-md px-3 py-2 text-sm no-underline transition-colors',
                  isActive
                    ? 'bg-hit-50 font-medium text-hit-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
