import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import DataNotice from '@/components/ui/DataNotice';
import { clusters, formatTuition, getClusterWithMajors, getMajor, majors } from '@/lib/data';
import type { ClusterWithMajors, Major } from '@/types';

const MAX_CLUSTER = 3;
const MAX_MAJOR = 4;

type Mode = 'cluster' | 'major';

interface Row {
  label: string;
  render: (item: ClusterWithMajors | Major) => React.ReactNode;
}

/** 大类对比行定义 */
const CLUSTER_ROWS: Row[] = [
  { label: '招生大类', render: (i) => (i as ClusterWithMajors).name },
  { label: '类别', render: (i) => (i as ClusterWithMajors).kind },
  { label: '选考科目', render: (i) => (i as ClusterWithMajors).subjectRequirement.join(' + ') },
  { label: '学费标准', render: (i) => formatTuition((i as ClusterWithMajors).tuition) },
  { label: '培养地点', render: (i) => (i as ClusterWithMajors).campusPlan },
  { label: '培养模式', render: (i) => (i as ClusterWithMajors).mode },
  { label: '专业数量', render: (i) => `${(i as ClusterWithMajors).majors.length} 个` },
  {
    label: '包含专业',
    render: (i) => (i as ClusterWithMajors).majors.map((m) => m.name).join('、'),
  },
  { label: '涉及学院', render: (i) => (i as ClusterWithMajors).colleges.join('、') },
  { label: '转专业政策', render: (i) => (i as ClusterWithMajors).transferPolicy },
];

/** 专业对比行定义 */
const MAJOR_ROWS: Row[] = [
  { label: '专业名称', render: (i) => (i as Major).name },
  { label: '所属学院', render: (i) => (i as Major).college },
  { label: '培养地点', render: (i) => (i as Major).campus },
  { label: '选考科目', render: (i) => (i as Major).subjectRequirement.join(' + ') },
  { label: '软科评级', render: (i) => (i as Major).rank ?? '—' },
  {
    label: '所属大类',
    render: (i) =>
      (i as Major).clusterIds
        .map((id) => clusters.find((c) => c.id === id)?.shortName ?? id)
        .join('、'),
  },
  { label: '专业方向', render: (i) => (i as Major).directions?.join('、') || '—' },
  {
    label: '本科核心课程',
    render: (i) => (i as Major).coreCourses?.join('；') || '—',
  },
];

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('m') ? 'major' : 'cluster';

  const selectedIds = useMemo(() => {
    const raw = params.get(mode === 'cluster' ? 'c' : 'm') ?? '';
    return raw.split(',').filter(Boolean);
  }, [params, mode]);

  const selected = useMemo(() => {
    if (mode === 'cluster') {
      return selectedIds
        .map((id) => getClusterWithMajors(id))
        .filter((x): x is ClusterWithMajors => Boolean(x));
    }
    return selectedIds.map((id) => getMajor(id)).filter((x): x is Major => Boolean(x));
  }, [selectedIds, mode]);

  const switchMode = (next: Mode) => {
    const p = new URLSearchParams();
    if (next === 'major') p.set('m', '');
    setParams(p, { replace: true });
  };

  const toggle = (id: string) => {
    const key = mode === 'cluster' ? 'c' : 'm';
    const limit = mode === 'cluster' ? MAX_CLUSTER : MAX_MAJOR;
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id].slice(-limit);
    const p = new URLSearchParams(params);
    p.set(key, next.join(','));
    setParams(p, { replace: true });
  };

  const rows = mode === 'cluster' ? CLUSTER_ROWS : MAJOR_ROWS;
  const limit = mode === 'cluster' ? MAX_CLUSTER : MAX_MAJOR;

  return (
    <>
      <Breadcrumbs />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">数据对比</h1>
      <p className="mb-5 text-[13px] text-slate-500">
        并列查看最多 {mode === 'cluster' ? MAX_CLUSTER : MAX_MAJOR} 项，仅呈现官方公开字段，不做优劣评价。
      </p>

      <DataNotice compact />

      <div className="mb-4 inline-flex overflow-hidden rounded-md border border-slate-200">
        {(
          [
            ['cluster', '对比大类'],
            ['major', '对比专业'],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`px-3.5 py-2 text-[13px] transition-colors ${
              mode === m ? 'bg-hit-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 选择区 */}
      <div className="card mb-5 p-3.5">
        <p className="field-label">
          选择对比项（已选 {selectedIds.length}/{limit}）
        </p>
        <div className="thin-scroll flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
          {(mode === 'cluster' ? clusters : majors).map((item) => {
            const active = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={active}
                className={`rounded border px-2.5 py-1 text-[12.5px] transition-colors ${
                  active
                    ? 'border-hit-700 bg-hit-700 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-hit-300 hover:text-hit-700'
                }`}
              >
                {mode === 'cluster' ? (item as ClusterWithMajors).shortName : (item as Major).name}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length === 0 ? (
        <p className="card px-4 py-12 text-center text-[13px] text-slate-400">
          请在上方选择需要对比的项目。
        </p>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl" style={{ minWidth: 240 + selected.length * 220 }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>对比项</th>
                  {selected.map((item) => (
                    <th key={item.id}>
                      <Link
                        to={mode === 'cluster' ? `/clusters/${item.id}` : `/majors/${item.id}`}
                        className="text-hit-700 hover:underline"
                      >
                        {mode === 'cluster' ? (item as ClusterWithMajors).name : (item as Major).name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = selected.map((item) => row.render(item));
                  const allSame = values.every((v) => String(v) === String(values[0]));
                  return (
                    <tr key={row.label}>
                      <td className="whitespace-nowrap bg-slate-50 font-medium text-slate-600">{row.label}</td>
                      {values.map((v, i) => (
                        <td
                          key={i}
                          className={allSame && selected.length > 1 ? 'text-slate-500' : 'text-slate-700'}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
        说明：表格中字段相同的单元格以浅色显示，便于快速识别差异；本站不对任何选项作出推荐或评价。
      </p>
    </>
  );
}
