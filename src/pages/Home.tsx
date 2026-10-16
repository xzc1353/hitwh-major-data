import { Link } from 'react-router-dom';
import DataNotice from '@/components/ui/DataNotice';
import ClusterCard from '@/components/ui/ClusterCard';
import { getAllClustersWithMajors, getStats, meta } from '@/lib/data';

const FLOW = [
  { step: '高考录取', desc: '按招生大类（专业集群）录取；分数优先，专业之间无级差' },
  { step: '第一学年', desc: '厚植数理基础、统一培养；学年末非拔尖班学生确定托管学院' },
  { step: '第二学年', desc: '夯实工程领域基础、分类培养；大二结束后在录取集群内任选专业' },
  { step: '第三、四学年', desc: '实施工程驱动的学科专业交叉培养' },
];

export default function Home() {
  const clusters = getAllClustersWithMajors();
  const stats = getStats();

  return (
    <>
      <section className="mb-6 rounded-xl bg-gradient-to-br from-hit-800 via-hit-700 to-hit-500 px-6 py-8 text-white shadow-pop sm:px-9 sm:py-10">
        <p className="mb-2 inline-block rounded border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11.5px] tracking-[0.18em]">
          公开信息搬运 · 结构化查阅
        </p>
        <h1 className="text-2xl font-bold leading-snug sm:text-[28px]">
          哈工大（威海）大类招生 · 专业数据参考
        </h1>
        <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-white/85">
          汇总 2026 年威海校区各工科试验班大类的专业构成、选考科目、学费标准与分流规则。
          本站仅做公开数据的结构化整理，
          <strong className="font-semibold text-white">不提供任何报考建议</strong>。
        </p>

        <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/20 pt-5 sm:grid-cols-4">
          {[
            { k: '招生大类', v: stats.clusterCount },
            { k: '专业条目', v: stats.majorCount },
            { k: '涉及学院', v: stats.collegeCount },
            { k: '数据截止', v: stats.updatedAt },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-[11.5px] text-white/70">{s.k}</dt>
              <dd className="mt-0.5 text-xl font-semibold">{s.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <DataNotice />

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="sec-title mb-0">招生大类</h2>
          <Link to="/clusters" className="text-[13px] hover:underline">
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {clusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="sec-title">选专业流程（“1+1+X”培养模式）</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((f, i) => (
            <li key={f.step} className="card p-4">
              <span className="mb-2 grid h-6 w-6 place-items-center rounded-full bg-hit-50 text-[12px] font-semibold text-hit-700">
                {i + 1}
              </span>
              <p className="text-[13.5px] font-semibold text-slate-800">{f.step}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{f.desc}</p>
            </li>
          ))}
        </ol>
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-400">
          官方表述：“在专业分流时完全按照学生意愿在本专业集群内任选专业。”各招生大类详情页均附「官方原文对照」，可逐条核验。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="sec-title">官方信源</h2>
        <ul className="card divide-y divide-slate-100 p-0 text-[13px]">
          {meta.sources.map((s) => (
            <li key={s.url} className="px-4 py-2.5">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-700 hover:text-hit-700 hover:underline"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-[12.5px] leading-relaxed text-amber-900/85">
        <p className="mb-1 font-semibold text-amber-800">时效性提示</p>
        <p>
          2026 级本科生于 2026 年 9 月入学，其"分托管学院"通知预计 2027 年 5 月前后发布、"集群内选择专业"通知预计
          2028 年 5 月前后发布。本站所列分流范围为 2024 级 / 2025 级已公布的正式版本，
          <strong className="font-medium">2026 级具体范围以届时教务处正式通知为准</strong>。
        </p>
      </section>
    </>
  );
}
