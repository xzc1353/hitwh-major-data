import { meta } from '@/lib/data';

/**
 * 数据说明条
 * ------------------------------------------------------------------
 * 红线要求：全站不得出现主观表述，数据来源必须可追溯。
 * 所有展示数据的页面顶部统一挂载本组件。
 */
export default function DataNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[12.5px] leading-relaxed text-slate-600">
      <p>
        <span className="mr-1.5 font-semibold text-slate-700">数据说明</span>
        数据版本 {meta.version} · 截止 {meta.updatedAt}。全部字段搬运自学校官方公开渠道，规则性表述
        <strong className="font-medium text-slate-700">逐字引用官方原文</strong>并附「官方原文对照」，
        <strong className="font-medium text-slate-700">不作改写、不作推断、不作评价</strong>。
      </p>
      {!compact && <p className="mt-1 text-slate-500">{meta.notice}</p>}
    </div>
  );
}
