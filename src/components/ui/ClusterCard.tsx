import { Link } from 'react-router-dom';
import type { ClusterWithMajors } from '@/types';
import { formatTuition } from '@/lib/data';

const KIND_STYLE: Record<string, string> = {
  拔尖班: 'tag-amber',
  卓越优才计划: 'tag-blue',
  常规大类: 'tag-slate',
  单专业招生: 'tag-slate',
  中外合作办学: 'tag-red',
};

/** 大类卡片 */
export default function ClusterCard({ cluster }: { cluster: ClusterWithMajors }) {
  const isCross = cluster.campusPlan.includes('校本部');

  return (
    <Link
      to={`/clusters/${cluster.id}`}
      className="card card-hover flex flex-col gap-3 p-4 no-underline"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug text-slate-900">{cluster.name}</h3>
        <span className={KIND_STYLE[cluster.kind] ?? 'tag-slate'}>{cluster.kind}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="tag-slate">选考 {cluster.subjectRequirement.join(' + ')}</span>
        <span className="tag-slate">{formatTuition(cluster.tuition)}</span>
        <span className="tag-slate">{cluster.majors.length} 个专业</span>
        {isCross && <span className="tag-amber">2+2 跨校区</span>}
      </div>

      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-slate-500">
        {cluster.majors.map((m) => m.name).join('、')}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2.5 text-[12px] text-slate-400">
        <span className="truncate">{cluster.campusPlan}</span>
        <span className="shrink-0 font-medium text-hit-700">查看详情 →</span>
      </div>
    </Link>
  );
}
