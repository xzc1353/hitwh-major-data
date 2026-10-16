import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import BackButton from '@/components/BackButton';
import DataNotice from '@/components/ui/DataNotice';
import SourceList from '@/components/ui/SourceList';
import ClusterComparison from '@/components/ui/ClusterComparison';
import CommentSection from '@/components/comments/CommentSection';
import { formatTuition, getClusterWithMajors, getQuotesOfCluster } from '@/lib/data';
import NotFound from './NotFound';

const KIND_STYLE: Record<string, string> = {
  拔尖班: 'tag-amber',
  卓越优才计划: 'tag-blue',
  常规大类: 'tag-slate',
  单专业招生: 'tag-slate',
  中外合作办学: 'tag-red',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-b-0 sm:flex sm:gap-4">
      <dt className="w-24 shrink-0 text-[12.5px] font-medium text-slate-500 sm:pt-0.5">{label}</dt>
      <dd className="mt-1 text-[13.5px] leading-relaxed text-slate-700 sm:mt-0">{children}</dd>
    </div>
  );
}

export default function ClusterDetail() {
  const { clusterId } = useParams();
  const cluster = getClusterWithMajors(clusterId);

  if (!cluster) return <NotFound />;

  const isCross = cluster.campusPlan.includes('校本部');
  const quotes = getQuotesOfCluster(cluster.id);

  return (
    <>
      <Breadcrumbs />
      <div className="mb-4">
        <BackButton fallback="/clusters" fallbackLabel="返回大类列表" />
      </div>

      <header className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{cluster.name}</h1>
          <span className={KIND_STYLE[cluster.kind] ?? 'tag-slate'}>{cluster.kind}</span>
          {isCross && <span className="tag-amber">2+2 跨校区培养</span>}
        </div>
        <p className="text-[13px] text-slate-500">
          共 {cluster.majors.length} 个可选专业 · {cluster.colleges.length} 个培养学院
        </p>
      </header>

      <DataNotice compact />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* 左：专业清单 */}
        <section>
          <h2 className="sec-title">包含专业（分流可选范围）</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '44%' }}>专业名称</th>
                    <th style={{ width: '38%' }}>所属学院</th>
                    <th style={{ width: '18%' }}>培养地点</th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.majors.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link to={`/majors/${m.id}`} className="font-medium text-hit-700 hover:underline">
                          {m.name}
                        </Link>
                        {m.rank && <span className="tag-slate ml-2">软科 {m.rank}</span>}
                      </td>
                      <td className="text-slate-600">{m.college}</td>
                      <td className="text-slate-500">{m.campus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] text-slate-400">
            依据"1+1+X"培养模式，学生在所属集群范围内自主选择专业，以志愿为唯一依据。
          </p>
        </section>

        {/* 右：基本信息 */}
        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="sec-title">基本信息</h2>
            <dl>
              <Field label="招生大类">{cluster.name}</Field>
              <Field label="选考科目">
                {cluster.subjectRequirement.join(' + ')}
                <span className="ml-1 text-slate-400">（3+3 与 3+1+2 模式一致）</span>
              </Field>
              <Field label="学费标准">{formatTuition(cluster.tuition)}</Field>
              <Field label="培养地点">{cluster.campusPlan}</Field>
              <Field label="培养模式">{cluster.mode}</Field>
              <Field label="培养学院">{cluster.colleges.join('、')}</Field>
            </dl>
          </section>

          <section className="card p-4">
            <h2 className="sec-title">转专业政策</h2>
            <p className="text-[13.5px] leading-relaxed text-slate-700">{cluster.transferPolicy}</p>
            {cluster.transferPolicyNote && (
              <p className="mt-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-2 text-[12.5px] leading-relaxed text-slate-500">
                {cluster.transferPolicyNote}
              </p>
            )}
            <p className="mt-2 text-[12px] text-slate-400">
              以上表述均取自学校公开文件，详见下方「官方原文对照」。
            </p>
          </section>

          {cluster.notes.length > 0 && (
            <section className="card p-4">
              <h2 className="sec-title">备注</h2>
              <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-relaxed text-slate-600">
                {cluster.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-4">
            <SourceList sources={cluster.sources} />
            <Link
              to={`/compare?c=${cluster.id}`}
              className="btn-ghost btn-xs mt-3"
            >
              加入数据对比 →
            </Link>
          </section>
        </aside>
      </div>

      <ClusterComparison majors={cluster.majors} />

      {quotes.length > 0 && (
        <section className="mt-6">
          <h2 className="sec-title">官方原文对照</h2>
          <p className="mb-3 text-[12.5px] leading-relaxed text-slate-500">
            以下为本页数据所依据的官方原文，<strong className="font-medium text-slate-600">逐字引用、未作改写</strong>，
            便于逐条核对。原文表述的适用版本以各自发布日期为准。
          </p>
          <div className="space-y-3">
            {quotes.map((q) => (
              <article key={q.id} className="card p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="tag-blue">{q.topic}</span>
                  {q.quoteDate && <span className="text-[12px] text-slate-400">表述日期 {q.quoteDate}</span>}
                </div>
                <blockquote className="rounded border-l-2 border-hit-300 bg-slate-50/70 px-3 py-2 text-[13px] leading-relaxed text-slate-700">
                  {q.quote}
                </blockquote>
                <p className="mt-2 text-[12px] text-slate-400">
                  出处：
                  {q.sourceUrl ? (
                    <a
                      href={q.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-hit-700 hover:underline"
                    >
                      {q.source}
                    </a>
                  ) : (
                    q.source
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <CommentSection />
    </>
  );
}
