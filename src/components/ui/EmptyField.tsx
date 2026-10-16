/** 字段占位：当官方未公开该字段时统一展示，避免臆造内容 */
export default function EmptyField({ hint = '该字段暂无官方公开数据，请查阅学院当年培养方案。' }: { hint?: string }) {
  return (
    <p className="rounded border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-[12.5px] text-slate-400">
      {hint}
    </p>
  );
}
