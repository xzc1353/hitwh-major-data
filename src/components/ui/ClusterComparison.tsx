import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Major } from '@/types';

/** 可对比的维度 */
type DimKey =
  | 'objectives'
  | 'coreCourses'
  | 'requiredTraits'
  | 'learningDifficulty'
  | 'employment'
  | 'furtherStudy';

const DIMS: { key: DimKey; label: string }[] = [
  { key: 'objectives', label: '培养目标' },
  { key: 'coreCourses', label: '核心课程' },
  { key: 'requiredTraits', label: '能力要求' },
  { key: 'learningDifficulty', label: '学习难度' },
  { key: 'employment', label: '就业方向' },
  { key: 'furtherStudy', label: '深造路径' },
];

function clip(text: string | undefined, n = 90): string {
  if (!text) return '—';
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function valueOf(m: Major, key: DimKey): string | undefined {
  if (key === 'coreCourses') return m.coreCourses?.join(' ');
  if (key === 'furtherStudy') return m.furtherStudy?.join(' ');
  return m[key as 'objectives'];
}

/**
 * 大类内专业横向对比
 * ------------------------------------------------------------------
 * 中立原则：
 *   1. 单元格内容一律为官方原文截断，不做概括改写，不标注优劣；
 *   2. 「共性」只陈述各项完全一致的客观字段，不做评价；
 *   3. 「分布」只做客观计数，不排名、不建议。
 */
export default function ClusterComparison({ majors }: { majors: Major[] }) {
  const [active, setActive] = useState<DimKey[]>(['objectives', 'coreCourses', 'employment']);

  const toggle = (key: DimKey) => {
    setActive((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key],
    );
  };

  /** 共性：在所有专业间完全一致的客观字段 */
  const common = useMemo(() => {
    const uniq = (vals: string[]) => Array.from(new Set(vals));
    const subjects = uniq(majors.map((m) => m.subjectRequirement.join(' + ')));
    const campuses = uniq(majors.map((m) => m.campus));
    const out: { label: string; value: string }[] = [];
    if (subjects.length === 1) out.push({ label: '选考科目', value: subjects[0] });
    if (campuses.length === 1) out.push({ label: '培养地点', value: campuses[0] });
    return out;
  }, [majors]);

  /** 学院分布（客观计数） */
  const collegeDist = useMemo(() => {
    const map = new Map<string, number>();
    majors.forEach((m) => map.set(m.college, (map.get(m.college) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [majors]);

  /** 软科评级分布（客观计数） */
  const rankDist = useMemo(() => {
    const map = new Map<string, number>();
    majors.forEach((m) => map.set(m.rank ?? '未公开', (map.get(m.rank ?? '未公开') ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [majors]);

  /** 数据完整度（客观计数） */
  const dataCoverage = useMemo(
    () => majors.filter((m) => m.objectives || m.employment).length,
    [majors],
  );

  const shown = DIMS.filter((d) => active.includes(d.key));

  return (
    <section className="mt-6">
      <h2 className="sec-title">本大类内专业横向对比</h2>
      <p className="mb-3 text-[12.5px] leading-relaxed text-slate-500">
        下表各单元格均为官方招生网「专业解析」原文的<strong className="font-medium text-slate-600">截断呈现</strong>，
        未作概括或改写。本站不对任何专业作推荐、排序或优劣判断，差异请以官方原文为准。
      </p>

      {/* 维度选择 */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12.5px] text-slate-500">对比维度：</span>
        {DIMS.map((d) => {
          const on = active.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggle(d.key)}
              aria-pressed={on}
              className={`rounded border px-2.5 py-1 text-[12.5px] transition-colors ${
                on
                  ? 'border-hit-700 bg-hit-700 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-hit-300 hover:text-hit-700'
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* 对比表 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tbl" style={{ minWidth: 260 + shown.length * 240 }}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>专业名称</th>
                <th style={{ width: 150 }}>所属学院</th>
                <th style={{ width: 80 }}>软科评级</th>
                {shown.map((d) => (
                  <th key={d.key} style={{ width: 240 }}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {majors.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link to={`/majors/${m.id}`} className="font-medium text-hit-700 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="text-slate-600">{m.college}</td>
                  <td className="whitespace-nowrap text-slate-600">{m.rank ?? '—'}</td>
                  {shown.map((d) => {
                    const raw = valueOf(m, d.key);
                    return (
                      <td key={d.key} className="text-[12.5px] leading-relaxed text-slate-600">
                        <span title={raw ?? undefined}>{clip(raw)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-slate-400">
        鼠标悬停单元格可查看完整原文；点击专业名称进入详情页查看全部维度。
      </p>

      {/* 共性与差异（客观陈述） */}
      <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
        <section className="card p-4">
          <h3 className="mb-2 text-[13.5px] font-semibold text-slate-800">共性（完全一致的字段）</h3>
          {common.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">本大类内各专业在上述字段上不完全一致。</p>
          ) : (
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-600">
              {common.map((c) => (
                <li key={c.label}>
                  <span className="text-slate-400">{c.label}：</span>
                  {c.value}
                </li>
              ))}
              <li>
                <span className="text-slate-400">招生大类：</span>
                同一大类内各专业共享同一培养模式与分流规则
              </li>
            </ul>
          )}
        </section>

        <section className="card p-4">
          <h3 className="mb-2 text-[13.5px] font-semibold text-slate-800">学院归属分布</h3>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-600">
            {collegeDist.map(([college, n]) => (
              <li key={college} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{college}</span>
                <span className="shrink-0 text-slate-400">{n} 个专业</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h3 className="mb-2 text-[13.5px] font-semibold text-slate-800">软科评级分布</h3>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-600">
            {rankDist.map(([rank, n]) => (
              <li key={rank} className="flex justify-between gap-3">
                <span>{rank}</span>
                <span className="text-slate-400">{n} 个专业</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 border-t border-slate-100 pt-2 text-[11.5px] leading-relaxed text-slate-400">
            软科评级为第三方评价机构公开发布的评级结果，本站仅作搬运，
            <strong className="font-medium">不代表本站观点，也不作为优劣判断依据</strong>。
          </p>
        </section>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
        数据完整度：本大类 {majors.length} 个专业中，{dataCoverage} 个在官方招生网有「专业解析」页；
        其余为校本部培养专业，官方威海招生网未发布解析内容，故相应字段留空。
      </p>
    </section>
  );
}
