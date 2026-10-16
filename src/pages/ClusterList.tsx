import { useMemo, useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import DataNotice from '@/components/ui/DataNotice';
import ClusterCard from '@/components/ui/ClusterCard';
import { getAllClustersWithMajors } from '@/lib/data';
import type { ClusterKind } from '@/types';

const KIND_FILTERS: (ClusterKind | '全部')[] = [
  '全部',
  '拔尖班',
  '卓越优才计划',
  '常规大类',
  '单专业招生',
];

export default function ClusterList() {
  const clusters = getAllClustersWithMajors();
  const [keyword, setKeyword] = useState('');
  const [kind, setKind] = useState<ClusterKind | '全部'>('全部');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return clusters.filter((c) => {
      if (kind !== '全部' && c.kind !== kind) return false;
      if (!kw) return true;
      return (
        c.name.toLowerCase().includes(kw) ||
        c.majors.some((m) => m.name.toLowerCase().includes(kw)) ||
        c.colleges.some((col) => col.toLowerCase().includes(kw))
      );
    });
  }, [clusters, keyword, kind]);

  return (
    <>
      <Breadcrumbs />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">招生大类列表</h1>
      <p className="mb-5 text-[13px] text-slate-500">
        共 {clusters.length} 个招生大类。点击卡片进入大类详情，查看包含专业与分流规则。
      </p>

      <DataNotice compact />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索大类名称 / 专业名称 / 学院"
          className="min-w-[220px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-hit-400 focus:outline-none focus:ring-2 focus:ring-hit-100"
        />
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-slate-200">
          {KIND_FILTERS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`px-3 py-2 text-[12.5px] transition-colors ${
                kind === k ? 'bg-hit-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card px-4 py-10 text-center text-[13px] text-slate-400">没有匹配的招生大类。</p>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
    </>
  );
}
