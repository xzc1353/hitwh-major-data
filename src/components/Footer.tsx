import { Link } from 'react-router-dom';
import { DISCLAIMER, SITE } from '@/config/site';

/**
 * 页脚
 * ------------------------------------------------------------------
 * 红线要求：
 *  1. 必须展示"个人制作、非官方，有建议请联系QQ：3029624824"
 *  2. 必须展示免责声明
 *  3. 必须声明评论区内容与本平台及建站者无关
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print mt-14 border-t border-slate-200 bg-white">
      <div className="wrap py-8">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13px] font-semibold text-amber-800">
            {DISCLAIMER.short}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-amber-900/80">
            本站为个人整理的数据参考页，与哈尔滨工业大学及其威海校区无隶属关系。全部数据搬运自学校官方公开渠道，仅作结构化呈现，
            <strong className="font-medium">不构成任何报考建议或承诺</strong>
            ；招生专业、计划、选考科目、学费及分流规则均以学校当年正式公布文件为准。
          </p>
        </div>

        <div className="mt-5 grid gap-6 text-[12.5px] leading-relaxed text-slate-500 sm:grid-cols-3">
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-slate-700">关于本站</h3>
            <p>
              {SITE.name}
              <br />
              数据版本 {SITE.dataVersion} · 截止 {SITE.dataUpdatedAt}
            </p>
            <p className="mt-1.5">
              建站者联系 QQ：
              <span className="font-medium text-slate-700 select-all">{SITE.contactQQ}</span>
            </p>
          </div>

          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-slate-700">免责声明</h3>
            <p>
              本站不对因使用本站信息而产生的任何直接或间接后果承担责任。如内容存在不当之处，请通过上方 QQ 联系，核实后第一时间处理。
            </p>
            <p className="mt-1.5">
              <Link to="/about" className="text-hit-700 hover:underline">
                查看完整免责声明 →
              </Link>
            </p>
          </div>

          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold text-slate-700">评论区说明</h3>
            <p className="rounded border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-600">
              {DISCLAIMER.commentIsolation}
            </p>
          </div>
        </div>

        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-[12px] text-slate-400">
          © {year} {SITE.name} · 个人制作 · 非官方 · 联系 QQ：{SITE.contactQQ}
        </p>
      </div>
    </footer>
  );
}
