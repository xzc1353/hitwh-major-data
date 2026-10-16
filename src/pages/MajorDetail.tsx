import { Link, useParams } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import BackButton from '@/components/BackButton';
import DataNotice from '@/components/ui/DataNotice';
import SourceList from '@/components/ui/SourceList';
import EmptyField from '@/components/ui/EmptyField';
import Prose from '@/components/ui/Prose';
import CommentSection from '@/components/comments/CommentSection';
import { getClustersOfMajor, getMajor } from '@/lib/data';
import NotFound from './NotFound';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-2.5 last:border-b-0 sm:flex sm:gap-4">
      <dt className="w-24 shrink-0 text-[12.5px] font-medium text-slate-500 sm:pt-0.5">{label}</dt>
      <dd className="mt-1 text-[13.5px] leading-relaxed text-slate-700 sm:mt-0">{children}</dd>
    </div>
  );
}

export default function MajorDetail() {
  const { majorId } = useParams();
  const major = getMajor(majorId);

  if (!major) return <NotFound />;

  const clusters = getClustersOfMajor(major);

  return (
    <>
      <Breadcrumbs />
      <div className="mb-4">
        <BackButton fallback={clusters[0] ? `/clusters/${clusters[0].id}` : '/clusters'} fallbackLabel="返回大类详情" />
      </div>

      <header className="mb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-slate-900">{major.name}</h1>
          {major.rank && <span className="tag-blue">软科评级 {major.rank}</span>}
        </div>
        {major.intro && <p className="text-[13.5px] leading-relaxed text-slate-500">{major.intro}</p>}
      </header>

      <DataNotice compact />

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        {/* 主栏：各维度官方原文 */}
        <div className="space-y-4">
          <Prose title="专业概况与培养目标" text={major.objectives} collapseAt={380} />

          <section className="card p-4">
            <h2 className="sec-title">
              本科核心课程
              <span className="ml-1 text-[11.5px] font-normal text-slate-400">官方原文</span>
            </h2>
            {major.coreCourses?.length ? (
              <ul className="space-y-2 text-[13.5px] leading-relaxed text-slate-700">
                {major.coreCourses.map((c, i) => (
                  <li key={i} className="rounded border border-slate-100 bg-slate-50/60 px-3 py-2">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyField />
            )}
          </section>

          <Prose title="能力要求" text={major.requiredTraits} collapseAt={320} />
          <Prose title="学习难度" text={major.learningDifficulty} collapseAt={320} />
          <Prose title="应用场景" text={major.applications} collapseAt={360} />

          <section className="card p-4">
            <h2 className="sec-title">
              深造路径
              <span className="ml-1 text-[11.5px] font-normal text-slate-400">官方原文摘录</span>
            </h2>
            {major.furtherStudy?.length ? (
              <ul className="space-y-2 text-[13.5px] leading-relaxed text-slate-700">
                {major.furtherStudy.map((s, i) => (
                  <li key={i} className="rounded border-l-2 border-hit-300 bg-slate-50/70 px-3 py-2">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyField hint="官方招生网未单独公开深造数据，请查阅学院当年培养方案或就业质量报告。" />
            )}
          </section>

          <Prose title="就业方向" text={major.employment} collapseAt={380} />
          <Prose title="常见认知误区" text={major.misconceptions} collapseAt={320} />
        </div>

        {/* 侧栏：基本信息 */}
        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="sec-title">基本信息</h2>
            <dl>
              <Field label="专业名称">{major.name}</Field>
              <Field label="所属学院">{major.college}</Field>
              <Field label="培养地点">{major.campus}</Field>
              <Field label="选考科目">{major.subjectRequirement.join(' + ')}</Field>
              {major.rank && <Field label="软科评级">{major.rank}</Field>}
              <Field label="所属大类">
                <span className="flex flex-wrap gap-1.5">
                  {clusters.map((c) => (
                    <Link key={c.id} to={`/clusters/${c.id}`} className="tag-blue hover:underline">
                      {c.shortName}
                    </Link>
                  ))}
                </span>
              </Field>
            </dl>
          </section>

          {major.notes.length > 0 && (
            <section className="card p-4">
              <h2 className="sec-title">备注</h2>
              <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-relaxed text-slate-600">
                {major.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-4">
            <SourceList sources={major.sources} />
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              本页各维度内容均为官方招生网「专业解析」页原文，逐字搬运、未作改写。
              标注「官方未公开」的字段表示学校公开渠道无该项内容，本站不做推测填充。
            </p>
          </section>
        </aside>
      </div>

      <CommentSection />
    </>
  );
}
