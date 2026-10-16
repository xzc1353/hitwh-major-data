import Breadcrumbs from '@/components/Breadcrumbs';
import { COMMENT_CONFIG, DISCLAIMER, SITE } from '@/config/site';
import { meta } from '@/lib/data';

const FIELD_SCOPE = [
  { field: '大类名称 / 类别', coverage: '全部覆盖', note: '取自学校官方招生专业目录' },
  { field: '包含专业 / 所属学院', coverage: '全部覆盖', note: '取自学校官方招生专业目录与教务处分流通知' },
  { field: '选考科目 / 学费 / 培养地点', coverage: '全部覆盖', note: '取自学校官方招生专业目录' },
  { field: '转专业政策', coverage: '全部覆盖', note: '取自招生章程、本科招生网《转（选）专业》栏目、教务处准入实施细则指导意见，并附官方原文' },
  { field: '官方原文对照', coverage: '全部覆盖', note: '每个大类详情页列出该页数据所依据的官方原文，逐字引用、标注出处与表述日期' },
  { field: '专业方向 / 核心课程 / 就业去向', coverage: '部分覆盖', note: '仅学校本科招生网"专业解析"页面已公开的专业有此项，未公开者标注"暂无官方公开数据"' },
];

export default function About() {
  return (
    <>
      <Breadcrumbs />
      <h1 className="mb-1 text-xl font-semibold text-slate-900">关于本站</h1>
      <p className="mb-5 text-[13px] text-slate-500">
        站点性质、数据来源、字段覆盖范围与联系方式说明。
      </p>

      <section className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3.5">
        <p className="text-[13.5px] font-semibold text-amber-800">{DISCLAIMER.short}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-amber-900/80">
          本站为个人制作、非官方的第三方信息整理页面。
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className="card p-4">
            <h2 className="sec-title">免责声明</h2>
            <ol className="list-inside list-decimal space-y-2 text-[13.5px] leading-relaxed text-slate-700">
              {DISCLAIMER.full.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </section>

          <section className="card p-4">
            <h2 className="sec-title">字段覆盖范围</h2>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>字段</th>
                    <th style={{ width: '18%' }}>覆盖情况</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELD_SCOPE.map((f) => (
                    <tr key={f.field}>
                      <td className="font-medium text-slate-700">{f.field}</td>
                      <td>
                        <span className={f.coverage === '全部覆盖' ? 'tag-green' : 'tag-amber'}>
                          {f.coverage}
                        </span>
                      </td>
                      <td className="text-slate-600">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
              本站坚持"只搬运、不推测"原则：官方未公开的字段一律留空并标注，不以任何形式填充推测内容。
              凡涉及规则的表述（分流、转专业、录取等），均<strong className="font-medium text-slate-600">逐字引用官方原文</strong>并在对应大类页的「官方原文对照」中标注出处与表述日期；
              同一事项在不同文件中口径不一致时，并列呈现、不作取舍。
            </p>
          </section>

          <section className="card p-4">
            <h2 className="sec-title">评论区说明</h2>
            <p className="rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] leading-relaxed text-slate-600">
              {DISCLAIMER.commentIsolation}
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-600">
              <li>
                <strong className="font-medium text-slate-700">当前评论后端：</strong>
                {COMMENT_CONFIG.provider}
              </li>
              <li>
                <strong className="font-medium text-slate-700">身份隔离：</strong>
                评论区数据存储于第三方评论服务（Waline / Twikoo）及其数据库，本站不采集、不存储任何评论者信息。
              </li>
              <li>
                <strong className="font-medium text-slate-700">内容管理：</strong>
                站方仅保留对违法违规、广告、人身攻击等内容的删除权限，不对评论观点进行筛选或引导。
              </li>
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-4">
            <h2 className="sec-title">联系与版本</h2>
            <dl className="space-y-2.5 text-[13px]">
              <div>
                <dt className="field-label">建站者联系方式</dt>
                <dd className="text-slate-700">
                  QQ：<span className="select-all font-medium">{SITE.contactQQ}</span>
                </dd>
              </div>
              <div>
                <dt className="field-label">数据版本</dt>
                <dd className="text-slate-700">
                  {meta.version}（截止 {meta.updatedAt}）
                </dd>
              </div>
              <div>
                <dt className="field-label">站点性质</dt>
                <dd className="text-slate-700">个人制作 · 非官方 · 纯静态</dd>
              </div>
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
              如有数据纠错、内容下架或其他建议，请通过上方 QQ 联系，我们将在核实后处理。
            </p>
          </section>

          <section className="card p-4">
            <h2 className="sec-title">数据来源</h2>
            <ul className="space-y-2 text-[12.5px] leading-relaxed">
              {meta.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-hit-700 hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
