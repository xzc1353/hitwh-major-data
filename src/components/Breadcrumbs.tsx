import { Fragment } from 'react';
import { Link, useMatches } from 'react-router-dom';

export interface Crumb {
  label: string;
  /** 有 to 则可点击，无 to 视为当前页 */
  to?: string;
}

type MatchWithCrumb = {
  handle?: { crumb?: (params: Record<string, string | undefined>) => Crumb[] };
  params: Record<string, string | undefined>;
};

/**
 * 面包屑
 * ------------------------------------------------------------------
 * 由路由 `handle.crumb` 声明"完整路径链"，此处取最深匹配渲染。
 * 页面组件无需关心层级，新增路由只需在 App.tsx 补 handle 即可。
 */
export default function Breadcrumbs() {
  const matches = useMatches() as MatchWithCrumb[];

  const deepest = [...matches].reverse().find((m) => typeof m.handle?.crumb === 'function');
  if (!deepest?.handle?.crumb) return null;

  const items = deepest.handle.crumb(deepest.params);
  if (!items.length) return null;

  return (
    <nav aria-label="面包屑" className="no-print mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-slate-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li className="flex items-center">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="rounded px-1 text-slate-500 no-underline transition-colors hover:text-hit-700"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="px-1 font-medium text-slate-700" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="select-none text-slate-300">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
